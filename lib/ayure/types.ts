export type IntentKind =
  | "explore"
  | "buy"
  | "find_operator"
  | "transform"
  | "invest"
  | "offer_services";

export type EntityKind =
  | "property"
  | "professional"
  | "service"
  | "opportunity"
  | "business";

export type ProofState = "example" | "projected" | "reported" | "verified";

export interface SearchIntent {
  kind: IntentKind;
  rawQuery: string;
  location?: string;
  budgetMax?: number;
  targetKinds: EntityKind[];
  terms: string[];
}

export interface CatalogEntity {
  id: string;
  kind: EntityKind;
  title: string;
  subtitle: string;
  location: string;
  price?: number;
  services?: string[];
  intents: IntentKind[];
  tags: string[];
  proof: ProofState;
  image: string;
  example: true;
}

export interface MatchResult {
  entity: CatalogEntity;
  score: number;
  reasons: string[];
}

export interface MatchResponse {
  intent: SearchIntent;
  fingerprint: string;
  results: MatchResult[];
}
