import { SyncResult } from "./index";

export async function googleConnector(_yearMonth: string): Promise<SyncResult> {
  return {
    amount: 0,
    currency: "USD",
    note: "Google Cloud billing requires OAuth 2.0 — auto-sync not supported. Log cost manually.",
    supported: false,
  };
}
