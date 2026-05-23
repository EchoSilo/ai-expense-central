export function toProviderKey(provider: string): string {
  return provider.toLowerCase().replace(/\s+/g, "");
}

// Providers with real API support (non-stub connectors)
const SYNCABLE = new Set(["openai", "anthropic", "elevenlabs", "assemblyai", "heygen"]);

export function isSyncable(provider: string): boolean {
  return SYNCABLE.has(toProviderKey(provider));
}
