import { SyncResult } from "./index";

export async function lovableConnector(_yearMonth: string): Promise<SyncResult> {
  return {
    amount: 0,
    currency: "USD",
    note: "Lovable has no public billing API — log cost manually.",
    supported: false,
  };
}
