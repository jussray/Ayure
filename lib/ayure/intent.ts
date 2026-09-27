import { catalog } from "./fixtures";
import type { EntityKind, IntentKind, MatchResult, SearchIntent } from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "i",
  "me",
  "my",
  "to",
  "for",
  "of",
  "in",
  "with",
  "want",
  "need",
  "looking",
  "find",
  "show",
  "help",
  "under",
  "within",
]);

const intentRules: Array<{ kind: IntentKind; terms: string[] }> = [
  { kind: "buy", terms: ["buy", "purchase", "acquire", "acquisition", "for sale"] },
  { kind: "find_operator", terms: ["operator", "manager", "manage", "cohost", "co-host", "property manager"] },
  { kind: "transform", terms: ["transform", "renovate", "renovation", "design", "improve", "listing", "perform better"] },
  { kind: "invest", terms: ["invest", "investment", "return", "portfolio", "capital"] },
  { kind: "offer_services", terms: ["offer services", "clients", "contractor", "designer", "photographer", "service provider"] },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9$.,\-\s]/g, " ").replace(/\s+/g, " ").trim();
}

function detectIntent(query: string, explicit?: IntentKind): IntentKind {
  if (explicit && explicit !== "explore") return explicit;
  const normalized = normalize(query);
  let best: { kind: IntentKind; score: number } = { kind: "explore", score: 0 };
  for (const rule of intentRules) {
    const score = rule.terms.reduce((sum, term) => sum + (normalized.includes(term) ? 1 : 0), 0);
    if (score > best.score) best = { kind: rule.kind, score };
  }
  return best.kind;
}

function detectBudget(query: string): number | undefined {
  const normalized = normalize(query);
  const matcher = /\$?\s?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k|m)?\b/gi;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(normalized)) !== null) {
    const raw = Number(match[1].replace(/,/g, ""));
    if (!Number.isFinite(raw)) continue;

    const suffix = match[2]?.toLowerCase();
    const hasCurrencyMarker = match[0].includes("$");
    if (suffix === "k") return Math.round(raw * 1000);
    if (suffix === "m") return Math.round(raw * 1000000);
    if (hasCurrencyMarker || raw >= 10000) return Math.round(raw);
  }

  return undefined;
}

function detectLocation(query: string): string | undefined {
  const stop = "(?=$|,|\\.|\\s+(?:under|with|for|and|that|where|who|at)\\b|\\s+\\$?\\d[\\d,.]*\\s*(?:k|m)?\\b)";
  const patterns = [
    new RegExp(`within\\s+\\d+(?:\\.\\d+)?\\s+hours?\\s+of\\s+([a-z][a-z\\s.'-]{1,40}?)${stop}`, "i"),
    new RegExp(`(?:near|around)\\s+([a-z][a-z\\s.'-]{1,40}?)${stop}`, "i"),
    new RegExp(`\\bin\\s+(?!a\\b|an\\b|the\\b)([a-z][a-z\\s.'-]{1,40}?)${stop}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function targetKindsFor(kind: IntentKind): EntityKind[] {
  switch (kind) {
    case "buy":
      return ["property", "professional", "opportunity"];
    case "find_operator":
      return ["professional", "business", "service"];
    case "transform":
      return ["service", "professional", "business"];
    case "invest":
      return ["property", "opportunity", "professional"];
    case "offer_services":
      return ["opportunity", "business", "professional"];
    default:
      return ["property", "professional", "service", "opportunity", "business"];
  }
}

export function parseIntent(rawQuery: string, explicit?: IntentKind): SearchIntent {
  const normalized = normalize(rawQuery);
  const kind = detectIntent(normalized, explicit);
  const terms = Array.from(
    new Set(normalized.split(" ").filter((term) => term.length > 2 && !STOP_WORDS.has(term) && !/^\$?\d/.test(term))),
  );
  return {
    kind,
    rawQuery: rawQuery.trim(),
    location: detectLocation(rawQuery),
    budgetMax: detectBudget(rawQuery),
    targetKinds: targetKindsFor(kind),
    terms,
  };
}

export function matchCatalog(intent: SearchIntent): MatchResult[] {
  return catalog
    .map((entity) => {
      let score = 5;
      const reasons: string[] = [];

      if (entity.intents.includes(intent.kind)) {
        score += 40;
        reasons.push("Matches your goal");
      }

      if (intent.targetKinds.includes(entity.kind)) {
        score += 18;
        reasons.push(`Relevant ${entity.kind}`);
      }

      if (intent.location) {
        const wanted = intent.location.toLowerCase();
        const actual = entity.location.toLowerCase();
        if (actual.includes(wanted) || wanted.includes(actual.split(",")[0])) {
          score += 24;
          reasons.push("Location fit");
        }
      }

      if (intent.budgetMax && entity.kind === "property" && entity.price) {
        if (entity.price <= intent.budgetMax) {
          score += 18;
          reasons.push("Within stated budget");
        } else {
          score -= 25;
        }
      }

      const haystack = [entity.title, entity.subtitle, entity.location, ...entity.tags, ...(entity.services ?? [])]
        .join(" ")
        .toLowerCase();
      const overlaps = intent.terms.filter((term) => haystack.includes(term));
      if (overlaps.length) {
        score += Math.min(overlaps.length * 6, 24);
        reasons.push(`Matches: ${overlaps.slice(0, 3).join(", ")}`);
      }

      reasons.push(`Proof state: ${entity.proof}`);
      return { entity, score: Math.max(0, Math.min(score, 100)), reasons };
    })
    .filter((result) => result.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
