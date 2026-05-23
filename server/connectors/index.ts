export interface SyncResult {
  amount: number;
  currency: "USD";
  note: string;
  supported: boolean;
  dailyAmounts?: { date: string; amount: number }[]; // YYYY-MM-DD
}

export type ConnectorFn = (yearMonth: string) => Promise<SyncResult>;

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    const err = new Error(`Missing env var: ${key}`) as any;
    err.code = "MISSING_API_KEY";
    throw err;
  }
  return val;
}

export function apiError(status: number, body: string): Error {
  const err = new Error(`HTTP ${status}: ${body.slice(0, 200)}`);
  (err as any).code = "API_ERROR";
  return err;
}

import { openaiConnector } from "./openai";
import { anthropicConnector } from "./anthropic";
import { elevenlabsConnector } from "./elevenlabs";
import { assemblyaiConnector } from "./assemblyai";
import { heygenConnector } from "./heygen";
import { googleConnector } from "./google";
import { replitConnector } from "./replit";
import { lovableConnector } from "./lovable";

export const CONNECTORS: Record<string, ConnectorFn> = {
  openai: openaiConnector,
  anthropic: anthropicConnector,
  elevenlabs: elevenlabsConnector,
  assemblyai: assemblyaiConnector,
  heygen: heygenConnector,
  google: googleConnector,
  replit: replitConnector,
  lovable: lovableConnector,
};
