import { SyncResult, requireEnv } from "./index";

export async function openaiConnector(yearMonth: string): Promise<SyncResult> {
  requireEnv("OPENAI_API_KEY");

  // OpenAI's billing cost API requires a browser session token, not a secret key.
  // Direct the user to the platform dashboard for the actual spend figure.
  return {
    amount: 0,
    currency: "USD",
    note: `OpenAI key configured ✓ — check platform.openai.com/usage for ${yearMonth} spend, then log it manually`,
    supported: true,
  };
}
