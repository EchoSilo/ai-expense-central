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

  // Surface the upcoming invoice amount if available
  const nextInvoiceCents: number = json.next_invoice?.amount_due_cents ?? 0;
  const overage: number = parseFloat(json.current_overage?.amount ?? "0");
  const amount = nextInvoiceCents > 0
    ? Math.round((nextInvoiceCents / 100 + overage) * 100) / 100
    : 0;

  const note = amount > 0
    ? `ElevenLabs: ${used.toLocaleString()}/${limit.toLocaleString()} chars (${pct}%, ${tier}) — $${amount.toFixed(2)} due`
    : `ElevenLabs: ${used.toLocaleString()}/${limit.toLocaleString()} chars (${pct}%, ${tier}) — enter invoice amount manually`;

  return { amount, currency: "USD", note, supported: true };
}
