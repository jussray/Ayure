import "server-only";
import { getDb } from "./pool";

export type AyureLeadRole = "buyer" | "owner" | "investor" | "operator" | "service_provider";

export type NewAyureLead = {
  role: AyureLeadRole;
  name: string;
  email: string;
  goal: string;
  receipt: string;
};

type InsertedLeadRow = {
  receipt: string;
  status: "received";
  created_at: Date;
};

export type InsertedAyureLead = {
  receipt: string;
  status: "received";
  createdAt: Date;
};

export async function insertAyureLead(input: NewAyureLead): Promise<InsertedAyureLead> {
  const result = await getDb().query<InsertedLeadRow>(
    `
      INSERT INTO public.ayure_leads (
        role,
        name,
        email,
        goal,
        receipt,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'received')
      RETURNING receipt, status, created_at
    `,
    [input.role, input.name, input.email, input.goal, input.receipt],
  );

  if (result.rowCount !== 1 || !result.rows[0]) {
    throw new Error("AYURE lead persistence returned no row");
  }

  const row = result.rows[0];
  if (row.status !== "received" || row.receipt !== input.receipt) {
    throw new Error("AYURE lead persistence returned an unexpected receipt or status");
  }

  return {
    receipt: row.receipt,
    status: row.status,
    createdAt: row.created_at,
  };
}
