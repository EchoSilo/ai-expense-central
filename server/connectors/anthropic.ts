import { SyncResult, requireEnv, apiError } from "./index";

export async function anthropicConnector(yearMonth: string): Promise<SyncResult> {
  // Cost API requires an Admin key (sk-ant-admin...), not a standard API key.
  // Generate one at: console.anthropic.com/settings/admin-keys
  const key = requireEnv("ANTHROPIC_ADMIN_KEY");

  const [year, month] = yearMonth.split("-").map(Number);
  const startingAt = new Date(year, month - 1, 1).toISOString();
  const endingAt = new Date(year, month, 1).toISOString();

  const url = `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${startingAt}&ending_at=${endingAt}&bucket_width=1d`;

  const res = await fetch(url, {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();

  // Costs are returned as decimal strings in cents; sum across all daily buckets
  const totalCents: number = (json.data ?? []).reduce((sum: number, bucket: any) => {
    const bucketCost = parseFloat(bucket.cost ?? bucket.total_cost ?? "0");
    return sum + bucketCost;
  }, 0);

  const amount = Math.round((totalCents / 100) * 100) / 100;

  return {
    amount,
    currency: "USD",
    note: `Anthropic org cost via Admin API (${yearMonth})`,
    supported: true,
  };
}
