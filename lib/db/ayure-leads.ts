import "server-only";
import { isDatabaseConfigured as isD1Configured } from "./cloudflare-d1";
import { isDatabaseConfigured as isPostgresConfigured } from "./postgres";
import { resolveLeadBackend } from "./storage-mode";
import { insertAyureLeadD1 } from "./ayure-leads-d1";
import { insertAyureLeadPostgres } from "./ayure-leads-postgres";

export type AyureLeadRole = "buyer" | "owner" | "investor" | "operator" | "service_provider";
export type NewAyureLead = {
  role: AyureLeadRole;
  name: string;
  email: string;
  goal: string;
  receipt: string;
};
export type InsertedAyureLead = {
  receipt: string;
  status: "received";
  createdAt: Date;
};

export function isLeadDatabaseConfigured(): boolean {
  try {
    const backend = resolveLeadBackend(process.env.AYURE_LEADS_STORAGE);
    return backend === "postgres" ? isPostgresConfigured() : isD1Configured();
  } catch {
    return false; // Unknown modes fail closed rather than switching data stores.
  }
}

export async function insertAyureLead(input: NewAyureLead): Promise<InsertedAyureLead> {
  const backend = resolveLeadBackend(process.env.AYURE_LEADS_STORAGE);
  return backend === "postgres" ? insertAyureLeadPostgres(input) : insertAyureLeadD1(input);
}
