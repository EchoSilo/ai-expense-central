import { SyncResult, requireEnv, apiError } from "./index";

export async function elevenlabsConnector(_yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("ELEVENLABS_API_KEY");

  const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: { "xi-api-key": key },
  });

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();
  const used: number = json.character_count ?? 0;
  const limit: number = json.character_limit ?? 1;
  const tier: string = json.tier ?? "unknown";
  const pct = ((used / limit) * 100).toFixed(1);

  return {
    amount: 0,
    currency: "USD",
    note: `ElevenLabs: ${used.toLocaleString()}/${limit.toLocaleString()} chars used (${pct}%, ${tier} plan) — enter invoice amount manually`,
    supported: true,
  };
}
