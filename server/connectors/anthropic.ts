import { SyncResult, requireEnv, apiError } from "./index";

export async function anthropicConnector(yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("ANTHROPIC_API_KEY");
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = `${yearMonth}-01`;
  const endDate = new Date(year, month, 1).toISOString().slice(0, 10);

  const res = await fetch(
    `https://api.anthropic.com/v1/organizations/usage?start_date=${startDate}&end_date=${endDate}`,
    {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "usage-2025-01-01",
      },
    }
  );

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();
  const amount =
    json.total_cost ??
    json.data?.total_cost ??
    (json.data ?? []).reduce((sum: number, item: any) => sum + (item.cost ?? 0), 0);

  return {
    amount: Math.round(amount * 100) / 100,
    currency: "USD",
    note: `Anthropic usage (${yearMonth})`,
    supported: true,
  };
}
