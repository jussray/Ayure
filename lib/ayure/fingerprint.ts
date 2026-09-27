import type { SearchIntent } from "./types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
  return `{${entries.join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createIntentFingerprint(intent: SearchIntent): string {
  const privacySafe = {
    kind: intent.kind,
    location: intent.location ?? null,
    budgetMax: intent.budgetMax ?? null,
    targetKinds: intent.targetKinds,
    terms: intent.terms,
  };
  return `ayure-intent-v1-${fnv1a(stableStringify(privacySafe))}`;
}
