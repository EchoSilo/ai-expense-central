import { SyncResult, requireEnv, apiError } from "./index";

export async function heygenConnector(_yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("HEYGEN_API_KEY");

  const res = await fetch("https://api.heygen.com/v2/user/remaining_quota", {
    headers: { "X-Api-Key": key },
  });

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();
  // quota units = seconds of video; ~$1 per 60 units
  const quota: number = json.data?.remaining_quota ?? json.remaining_quota ?? 0;
  const dollarEquivalent = (quota / 60).toFixed(2);

  return {
    amount: 0,
    currency: "USD",
    note: `HeyGen API wallet: ~$${dollarEquivalent} remaining (${quota} quota units) — enter actual spend manually`,
    supported: true,
  };
}
