import { useState, useCallback } from 'react';
import { CostEntry, AnomalyResult } from '@/lib/types';

const STORAGE_KEY = 'ai-expense-cost-history';

function load(): CostEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(entries: CostEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function computeAnomaly(
  entries: CostEntry[],
  serviceId: string,
  yearMonth: string
): AnomalyResult {
  const prior = entries
    .filter((e) => e.serviceId === serviceId && e.yearMonth < yearMonth)
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
    .slice(0, 3);

  const current = entries.find(
    (e) => e.serviceId === serviceId && e.yearMonth === yearMonth
  );

  const baseline =
    prior.length ? prior.reduce((s, e) => s + e.amount, 0) / prior.length : 0;

  if (prior.length < 2 || !current) {
    return { isAnomaly: false, severity: null, deviationPct: 0, baseline, threshold: 0, dataPoints: prior.length };
  }

  const vals = prior.map((e) => e.amount);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  // Floor std at 5% of mean so flat subscriptions don't false-alarm on $0.01 changes
  const std = Math.max(Math.sqrt(variance), mean * 0.05);
  const threshold = mean + 2 * std;

  const deviationPct = mean > 0 ? ((current.amount - mean) / mean) * 100 : 0;
  const sigmas = std > 0 ? (current.amount - mean) / std : 0;
  const isAnomaly = current.amount > threshold;
  const severity: AnomalyResult['severity'] = isAnomaly
    ? sigmas > 3 ? 'critical' : 'warning'
    : null;

  return { isAnomaly, severity, deviationPct, baseline: mean, threshold, dataPoints: prior.length };
}

export function useCostHistory() {
  const [entries, setEntries] = useState<CostEntry[]>(load);

  const addOrUpdateEntry = useCallback((entry: Omit<CostEntry, 'id' | 'loggedAt'>) => {
    setEntries((prev) => {
      const filtered = prev.filter(
        (e) => !(e.serviceId === entry.serviceId && e.yearMonth === entry.yearMonth)
      );
      const next: CostEntry[] = [
        ...filtered,
        { ...entry, id: Date.now().toString(), loggedAt: new Date().toISOString() },
      ];
      save(next);
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      save(next);
      return next;
    });
  }, []);

  const getEntriesForService = useCallback(
    (serviceId: string) =>
      entries
        .filter((e) => e.serviceId === serviceId)
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)),
    [entries]
  );

  const getLatestAnomalyForService = useCallback(
    (serviceId: string): AnomalyResult | null => {
      const latest = entries
        .filter((e) => e.serviceId === serviceId)
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))[0];
      if (!latest) return null;
      return computeAnomaly(entries, serviceId, latest.yearMonth);
    },
    [entries]
  );

  const getBaselineForService = useCallback(
    (serviceId: string): number => {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      const prior = entries
        .filter((e) => e.serviceId === serviceId && e.yearMonth < currentYearMonth)
        .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
        .slice(0, 3);
      if (!prior.length) return 0;
      return prior.reduce((s, e) => s + e.amount, 0) / prior.length;
    },
    [entries]
  );

  return {
    entries,
    addOrUpdateEntry,
    deleteEntry,
    getEntriesForService,
    getLatestAnomalyForService,
    getBaselineForService,
  };
}
