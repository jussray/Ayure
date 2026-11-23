import "server-only";
import type { NewAyureLead, InsertedAyureLead } from "./ayure-leads";
import { withAyurePostgresClient } from "./postgres";

type InsertedLeadRow = {
  receipt: string;
  status: "received";
  created_at: Date;
};

export async function insertAyureLeadPostgres(input: NewAyureLead): Promise<InsertedAyureLead> {
  const result = await withAyurePostgresClient((client) =>
    client.query<InsertedLeadRow>(
      `INSERT INTO public.ayure_leads (role, name, email, goal, receipt)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING receipt, status, created_at`,
      [input.role, input.name, input.email, input.goal, input.receipt],
    ),
  );
  const row = result.rows[0];
  if (result.rowCount !== 1 || !row || row.receipt !== input.receipt || row.status !== "received") {
    throw new Error("AYURE lead persistence returned an unexpected receipt or status");
  }
  const createdAt = new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("AYURE lead persistence returned an invalid created_at value");
  }
  return { receipt: row.receipt, status: row.status, createdAt };
}
