import { SyncResult, requireEnv, apiError } from "./index";

export async function anthropicConnector(yearMonth: string): Promise<SyncResult> {
  const key = requireEnv("ANTHROPIC_API_KEY");

  // Verify the key is valid by hitting the models endpoint
  const res = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) throw apiError(res.status, await res.text());

  // Anthropic does not yet expose a public billing/usage cost API.
  // Direct the user to the console for the actual spend figure.
  return {
    amount: 0,
    currency: "USD",
    note: `Anthropic key verified ✓ — check console.anthropic.com/settings/billing for ${yearMonth} spend, then log it manually`,
    supported: true,
  };
}
