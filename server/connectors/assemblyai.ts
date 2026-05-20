import { SyncResult, requireEnv, apiError } from "./index";

export async function assemblyaiConnector(_yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("ASSEMBLYAI_API_KEY");

  const res = await fetch("https://api.assemblyai.com/v2/account", {
    headers: { authorization: key },
  });

  if (!res.ok) throw apiError(res.status, await res.text());

  const json = await res.json();
  const balance: number = json.current_balance ?? 0;

  return {
    amount: 0,
    currency: "USD",
    note: `AssemblyAI remaining balance: $${balance.toFixed(2)} — enter amount spent this month manually`,
    supported: true,
  };
}
