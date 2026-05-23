import { SyncResult } from "./index";

export async function replitConnector(_yearMonth: string): Promise<SyncResult> {
  return {
    amount: 0,
    currency: "USD",
    note: "Replit has no public billing API — log cost manually.",
    supported: false,
  };
}
