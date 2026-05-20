export interface CostEntry {
  id: string;
  serviceId: string;
  yearMonth: string; // "YYYY-MM" — one entry per service per month
  amount: number;
  note?: string;
  loggedAt: string; // ISO timestamp
}

export interface AnomalyResult {
  isAnomaly: boolean;
  severity: 'warning' | 'critical' | null;
  deviationPct: number;
  baseline: number;   // mean of prior 3 months
  threshold: number;  // mean + 2*std
  dataPoints: number; // months used in baseline
}
