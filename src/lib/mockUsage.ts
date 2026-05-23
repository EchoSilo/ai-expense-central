import { AIService } from "@/components/AIServiceCard";
import { CostEntry, AnomalyResult } from "@/lib/types";
import { computeAnomaly } from "@/hooks/use-cost-history";

export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: 'warning' | 'critical';
  reason: string;
  detail: string;
  triggeredAt: Date;
}

export function detectAlerts(services: AIService[], entries: CostEntry[]): Alert[] {
  const alerts: Alert[] = [];
  const currentYM = new Date().toISOString().slice(0, 7);

  for (const s of services) {
    const anomaly: AnomalyResult = computeAnomaly(entries, s.id, currentYM);
    if (anomaly.isAnomaly && anomaly.severity) {
      alerts.push({
        id: `${s.id}-mom`,
        serviceId: s.id,
        serviceName: s.name,
        severity: anomaly.severity,
        reason: 'Month-over-month spike',
        detail: `${anomaly.deviationPct > 0 ? '+' : ''}${anomaly.deviationPct.toFixed(0)}% vs 3-month avg`,
        triggeredAt: new Date(),
      });
    }
    if (s.expectedMonthlyBudget) {
      const current = entries.find((e) => e.serviceId === s.id && e.yearMonth === currentYM);
      if (current && current.amount > s.expectedMonthlyBudget * 1.2) {
        alerts.push({
          id: `${s.id}-budget`,
          serviceId: s.id,
          serviceName: s.name,
          severity: 'warning',
          reason: 'Budget exceeded',
          detail: `$${current.amount.toFixed(0)} vs $${s.expectedMonthlyBudget} budget`,
          triggeredAt: new Date(),
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
