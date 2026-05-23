import { SyncResult, requireEnv, apiError } from "./index";

export async function anthropicConnector(yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("ANTHROPIC_ADMIN_KEY");

  const [year, month] = yearMonth.split("-").map(Number);
  const startingAt = new Date(year, month - 1, 1).toISOString();
  const endingAt = new Date(year, month, 1).toISOString();

  const dailyMap = new Map<string, number>(); // date -> cents
  let page: string | null = null;

  do {
    const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
    url.searchParams.set("starting_at", startingAt);
    url.searchParams.set("ending_at", endingAt);
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.set("limit", "31");
    if (page) url.searchParams.set("page", page);

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!res.ok) throw apiError(res.status, await res.text());
    const json = await res.json();

    for (const bucket of json.data ?? []) {
      // amounts are in cents as decimal strings inside results[]
      const date: string = (bucket.starting_at ?? "").slice(0, 10);
      const bucketCents = (bucket.results ?? []).reduce((sum: number, r: any) => {
        return sum + parseFloat(r.amount ?? "0");
      }, 0);
      if (date) dailyMap.set(date, (dailyMap.get(date) ?? 0) + bucketCents);
    }

    page = json.has_more ? json.next_page : null;
  } while (page);

  const totalCents = Array.from(dailyMap.values()).reduce((a, b) => a + b, 0);
  const amount = Math.round((totalCents / 100) * 100) / 100;

  const dailyAmounts = Array.from(dailyMap.entries())
    .map(([date, cents]) => ({ date, amount: Math.round((cents / 100) * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    amount,
    currency: "USD",
    note: `Anthropic org cost via Admin API (${yearMonth})`,
    supported: true,
    dailyAmounts,
  };
}
