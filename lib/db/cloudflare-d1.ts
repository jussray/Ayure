import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1RunResult = {
  success: boolean;
};

type D1PreparedStatementLike = {
  bind(...values: unknown[]): D1PreparedStatementLike;
  run(): Promise<D1RunResult>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

type D1SessionLike = {
  prepare(query: string): D1PreparedStatementLike;
};

export type AyureD1Database = {
  prepare(query: string): D1PreparedStatementLike;
  withSession(constraint?: string): D1SessionLike;
};

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("AYURE_DB is not configured");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function getAyureDb(): AyureD1Database | null {
  try {
    const { env } = getCloudflareContext();
    const binding = (env as Record<string, unknown>).AYURE_DB;
    return (binding as AyureD1Database | undefined) ?? null;
  } catch {
    return null;
  }
}

export function requireAyureDb(): AyureD1Database {
  const db = getAyureDb();
  if (!db) {
    throw new DatabaseNotConfiguredError();
  }
  return db;
}

export function isDatabaseConfigured() {
  return getAyureDb() !== null;
}
