import { useQuery } from "@tanstack/react-query";
import { toProviderKey } from "@/lib/providerKey";

export interface SyncResult {
  amount: number;
  currency: "USD";
  note: string;
  supported: boolean;
}

export interface SyncError {
  error: string;
  code?: "MISSING_API_KEY" | "API_ERROR";
  supported?: boolean;
}

async function fetchSync(provider: string, yearMonth: string): Promise<SyncResult> {
  const key = toProviderKey(provider);
  const res = await fetch(`/api/sync/${key}?yearMonth=${yearMonth}`);
  const json = await res.json();
  if (!res.ok) throw json as SyncError;
  return json as SyncResult;
}

export function useSyncQuery(provider: string, yearMonth: string, enabled: boolean) {
  return useQuery<SyncResult, SyncError>({
    queryKey: ["sync", toProviderKey(provider), yearMonth],
    queryFn: () => fetchSync(provider, yearMonth),
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
