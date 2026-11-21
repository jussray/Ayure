/** The production D1 writer remains authoritative until an explicit, verified cutover. */
export type LeadBackend = "d1" | "postgres";
export function resolveLeadBackend(mode: string | undefined): LeadBackend {
  if (mode === undefined || mode === "d1") return "d1";
  if (mode === "postgres") return "postgres";
  throw new Error("Unsupported AYURE_LEADS_STORAGE setting");
}
