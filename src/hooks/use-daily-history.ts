import { useState, useCallback } from 'react';
import { DailyEntry } from '@/lib/types';

const STORAGE_KEY = 'ai-expense-daily-history';

function load(): DailyEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function save(entries: DailyEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useDailyHistory() {
  const [entries, setEntries] = useState<DailyEntry[]>(load);

  const upsertDailyEntries = useCallback(
    (serviceId: string, dailyAmounts: { date: string; amount: number }[]) => {
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.serviceId === serviceId && dailyAmounts.some((d) => d.date === e.date))
        );
        const next: DailyEntry[] = [
          ...filtered,
          ...dailyAmounts.map((d) => ({
            id: `${serviceId}-${d.date}`,
            serviceId,
            date: d.date,
            amount: d.amount,
          })),
        ];
        save(next);
        return next;
      });
    },
    []
  );

  const getEntriesForService = useCallback(
    (serviceId: string, days?: number) => {
      const cutoff = days
        ? new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
        : '0000-00-00';
      return entries
        .filter((e) => e.serviceId === serviceId && e.date >= cutoff)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [entries]
  );

  const getEntriesForRange = useCallback(
    (days: number) => {
      const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
      return entries.filter((e) => e.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    },
    [entries]
  );

  return { entries, upsertDailyEntries, getEntriesForService, getEntriesForRange };
}
