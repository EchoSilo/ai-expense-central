import { AIService } from "@/components/AIServiceCard";

export interface UsageEvent {
  serviceId: string;
  timestamp: Date;
  costUsd: number;
  tokens: number;
  model: string;
  isAnomaly?: boolean;
}

export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: 'warning' | 'critical';
  reason: string;
  detail: string;
  triggeredAt: Date;
  windowEvents: UsageEvent[];
}

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  Anthropic: ['claude-3.5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
  Google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  GitHub: ['copilot'],
};

// Seeded RNG for stable output across renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const cache = new Map<string, UsageEvent[]>();

export function getEventsForService(service: AIService, days = 90): UsageEvent[] {
  const cacheKey = `${service.id}:${days}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const rand = mulberry32(hashStr(service.id));
  const models = MODELS_BY_PROVIDER[service.provider] ?? ['default'];
  const baseHourly = (service.baselineDailyCost ?? service.amount ?? 5) / 24;

  const now = new Date();
  now.setMinutes(0, 0, 0);
  const events: UsageEvent[] = [];

  for (let h = days * 24 - 1; h >= 0; h--) {
    const ts = new Date(now.getTime() - h * 3600_000);
    const hour = ts.getHours();
    const day = ts.getDay();

    // Business hours weighting
    const businessFactor = hour >= 9 && hour <= 18 ? 1.4 : hour >= 22 || hour <= 6 ? 0.2 : 0.7;
    const weekendFactor = day === 0 || day === 6 ? 0.4 : 1;
    const noise = 0.6 + rand() * 0.8;
    const cost = baseHourly * businessFactor * weekendFactor * noise;
    const tokens = Math.round(cost * 50000);

    events.push({
      serviceId: service.id,
      timestamp: ts,
      costUsd: cost,
      tokens,
      model: models[Math.floor(rand() * models.length)],
    });
  }

  // Inject anomalies for specific seed services
  if (service.name === 'ChatGPT Plus') {
    // Velocity spike: last 18 hours, 5x baseline at odd hours
    for (let i = 0; i < 18; i++) {
      const ev = events[events.length - 1 - i];
      if (ev) {
        ev.costUsd = baseHourly * (4 + Math.random() * 2);
        ev.tokens = Math.round(ev.costUsd * 50000);
        ev.isAnomaly = true;
      }
    }
  }
  if (service.name === 'API Credits') {
    // Budget breach: massive 3am usage 2 days ago
    for (let i = 48; i < 56; i++) {
      const ev = events[events.length - 1 - i];
      if (ev) {
        ev.costUsd = baseHourly * 8;
        ev.tokens = Math.round(ev.costUsd * 50000);
        ev.isAnomaly = true;
      }
    }
  }

  cache.set(cacheKey, events);
  return events;
}

export function getDailyTotals(service: AIService, days = 30) {
  const events = getEventsForService(service, days);
  const byDay = new Map<string, { date: string; cost: number; anomaly: boolean }>();
  for (const e of events) {
    const key = e.timestamp.toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { date: key, cost: 0, anomaly: false };
    cur.cost += e.costUsd;
    if (e.isAnomaly) cur.anomaly = true;
    byDay.set(key, cur);
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getStackedDaily(services: AIService[], days = 30) {
  const byDay = new Map<string, Record<string, number | string>>();
  for (const s of services) {
    for (const d of getDailyTotals(s, days)) {
      const row = (byDay.get(d.date) ?? { date: d.date }) as Record<string, number | string>;
      row[s.name] = d.cost;
      byDay.set(d.date, row);
    }
  }
  return Array.from(byDay.values()).sort((a, b) =>
    (a.date as string).localeCompare(b.date as string)
  );
}

export function getHourlyHeatmap(service: AIService) {
  const events = getEventsForService(service, 30);
  // grid[day 0-6][hour 0-23] = avg cost
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const counts: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of events) {
    const d = e.timestamp.getDay();
    const h = e.timestamp.getHours();
    grid[d][h] += e.costUsd;
    counts[d][h] += 1;
  }
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (counts[d][h]) grid[d][h] /= counts[d][h];
    }
  }
  return grid;
}

export function getBaselineStats(service: AIService) {
  const daily = getDailyTotals(service, 60).filter(d => !d.anomaly);
  const vals = daily.map(d => d.cost);
  const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length || 1);
  const std = Math.sqrt(variance);
  return { mean, std, upper: mean + 2 * std, lower: Math.max(0, mean - 2 * std) };
}

export function getMonthOverMonth(services: AIService[]) {
  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLast = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonth = 0;
  let lastMonth = 0;
  for (const s of services) {
    for (const e of getEventsForService(s, 90)) {
      if (e.timestamp >= startThis) thisMonth += e.costUsd;
      else if (e.timestamp >= startLast) lastMonth += e.costUsd;
    }
  }
  const pct = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  return { thisMonth, lastMonth, pct };
}

export function detectAlerts(services: AIService[]): Alert[] {
  const alerts: Alert[] = [];
  for (const s of services) {
    const events = getEventsForService(s, 30);
    const last24 = events.slice(-24);
    const anomalousWindow = last24.filter(e => e.isAnomaly);
    if (anomalousWindow.length >= 3) {
      const totalCost = last24.reduce((a, b) => a + b.costUsd, 0);
      const baseline = (s.baselineDailyCost ?? s.amount ?? 5);
      const multiple = (totalCost / baseline).toFixed(1);
      alerts.push({
        id: `${s.id}-velocity`,
        serviceId: s.id,
        serviceName: s.name,
        severity: 'critical',
        reason: 'Velocity spike',
        detail: `${multiple}× baseline in the last 24h`,
        triggeredAt: new Date(),
        windowEvents: last24,
      });
    }
    // Budget breach check (monthly)
    if (s.expectedMonthlyBudget) {
      const monthAgo = Date.now() - 30 * 86400_000;
      const monthCost = events.filter(e => e.timestamp.getTime() >= monthAgo).reduce((a, b) => a + b.costUsd, 0);
      if (monthCost > s.expectedMonthlyBudget * 1.2) {
        alerts.push({
          id: `${s.id}-budget`,
          serviceId: s.id,
          serviceName: s.name,
          severity: 'warning',
          reason: 'Budget breach',
          detail: `$${monthCost.toFixed(0)} spent vs $${s.expectedMonthlyBudget} budget`,
          triggeredAt: new Date(),
          windowEvents: events.slice(-72),
        });
      }
    }
  }
  return alerts;
}

export function getProviderKeyDocsUrl(provider: string): string {
  const urls: Record<string, string> = {
    OpenAI: 'https://platform.openai.com/api-keys',
    Anthropic: 'https://console.anthropic.com/settings/keys',
    Google: 'https://console.cloud.google.com/apis/credentials',
    GitHub: 'https://github.com/settings/tokens',
  };
  return urls[provider] ?? '#';
}
