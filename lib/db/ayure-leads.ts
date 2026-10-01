import "server-only";
import { requireAyureDb } from "./cloudflare-d1";

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
  created_at: string;
};

export type InsertedAyureLead = {
  receipt: string;
  status: "received";
  createdAt: Date;
};

export async function insertAyureLead(input: NewAyureLead): Promise<InsertedAyureLead> {
  const session = requireAyureDb().withSession("first-primary");

  const insert = await session
    .prepare(
      `
        INSERT INTO ayure_leads (
          role,
          name,
          email,
          goal,
          receipt,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'received')
      `,
    )
    .bind(input.role, input.name, input.email, input.goal, input.receipt)
    .run();

  if (!insert.success) {
    throw new Error("AYURE lead persistence failed");
  }

  const row = await session
    .prepare(
      `
        SELECT receipt, status, created_at
        FROM ayure_leads
        WHERE receipt = ?
        LIMIT 1
      `,
    )
    .bind(input.receipt)
    .first<InsertedLeadRow>();

  if (!row || row.status !== "received" || row.receipt !== input.receipt) {
    throw new Error("AYURE lead persistence returned an unexpected receipt or status");
  }

  const createdAt = new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("AYURE lead persistence returned an invalid created_at value");
  }

  return {
    receipt: row.receipt,
    status: row.status,
    createdAt,
  };
}
