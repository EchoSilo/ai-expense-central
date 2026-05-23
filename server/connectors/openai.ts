import { SyncResult, requireEnv, apiError } from "./index";

export async function openaiConnector(yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("OPENAI_API_KEY");

  const [year, month] = yearMonth.split("-").map(Number);
  const startTime = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const endTime = Math.floor(new Date(year, month, 1).getTime() / 1000);

  const dailyMap = new Map<string, number>(); // date -> USD
  let page: string | null = null;

  do {
    const url = new URL("https://api.openai.com/v1/organization/costs");
    url.searchParams.set("start_time", String(startTime));
    url.searchParams.set("end_time", String(endTime));
    url.searchParams.set("bucket_width", "1d");
    url.searchParams.set("limit", "31");
    if (page) url.searchParams.set("page", page);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (!res.ok) throw apiError(res.status, await res.text());
    const json = await res.json();

    for (const bucket of json.data ?? []) {
      const date = new Date(bucket.start_time * 1000).toISOString().slice(0, 10);
      const bucketUsd = (bucket.results ?? []).reduce((sum: number, r: any) => {
        return sum + (r.amount?.value ?? 0);
      }, 0);
      dailyMap.set(date, (dailyMap.get(date) ?? 0) + bucketUsd);
    }

    page = json.has_more ? json.next_page : null;
  } while (page);

  const dailyAmounts = Array.from(dailyMap.entries())
    .map(([date, amt]) => ({ date, amount: Math.round(Number(amt) * 100) / 100 }))
    .filter((e) => e.amount > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const amount = Math.round(dailyAmounts.reduce((s, e) => s + e.amount, 0) * 100) / 100;

  return {
    amount,
    currency: "USD",
    note: `OpenAI org costs via Admin API (${yearMonth})`,
    supported: true,
    dailyAmounts,
  };
}
