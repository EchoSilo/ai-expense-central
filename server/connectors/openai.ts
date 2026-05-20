import { SyncResult, requireEnv, apiError } from "./index";

export async function openaiConnector(yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("OPENAI_API_KEY");
  const [year, month] = yearMonth.split("-").map(Number);
  const startTime = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
  const endTime = Math.floor(new Date(year, month, 1).getTime() / 1000);

  const res = await fetch(
    `https://api.openai.com/v1/organization/usage/costs?start_time=${startTime}&end_time=${endTime}&limit=100`,
    { headers: { Authorization: `Bearer ${key}` } }
  );

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();
  const amount: number = (json.data ?? []).reduce(
    (sum: number, item: any) => sum + (item.amount?.value ?? 0),
    0
  );

  return {
    amount: Math.round(amount * 100) / 100,
    currency: "USD",
    note: `OpenAI org usage costs (${yearMonth})`,
    supported: true,
  };
}
