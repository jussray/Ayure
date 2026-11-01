import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { insertAyureLead, type AyureLeadRole } from "../../../lib/db/ayure-leads";
import { isDatabaseConfigured } from "../../../lib/db/postgres";

export const runtime = "nodejs";

const roles = new Set<AyureLeadRole>(["buyer", "owner", "investor", "operator", "service_provider"]);
const MAX_BODY_BYTES = 16_384;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_GOAL_LENGTH = 2_000;
const responseHeaders = { "Cache-Control": "no-store" };

function reply(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

// Enforce the cap while reading, not only from an untrusted Content-Length header.
async function boundedJson(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) throw new Error("too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  let length = 0;
  const parts: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("too_large");
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof Error && error.message === "too_large") throw error;
    throw new Error("invalid_json");
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return reply({ error: "Expected application/json." }, 415);
  }
  let raw: unknown;
  try {
    raw = await boundedJson(request);
  } catch (error) {
    return error instanceof Error && error.message === "too_large"
      ? reply({ error: "Request body is too large." }, 413)
      : reply({ error: "Invalid JSON body." }, 400);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return reply({ error: "Invalid application." }, 400);
  }
  const payload = raw as Record<string, unknown>;
  // Server-validated honeypot: this field must always be empty.
  if (typeof payload.website !== "undefined" && payload.website !== "") {
    return reply({ error: "Invalid application." }, 400);
  }
  if (["role", "name", "email", "goal"].some((key) => typeof payload[key] !== "string")) {
    return reply({ error: "Invalid application." }, 400);
  }
  const role = (payload.role as string).trim();
  const name = (payload.name as string).trim();
  const email = (payload.email as string).trim().toLowerCase();
  const goal = (payload.goal as string).trim();
  const invalid =
    !roles.has(role as AyureLeadRole) ||
    name.length < 2 || name.length > MAX_NAME_LENGTH ||
    email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    goal.length < 8 || goal.length > MAX_GOAL_LENGTH;
  if (invalid) {
    return reply({ error: "Choose a role and provide a valid name, email, and concise description of what you want to make happen." }, 400);
  }
  if (!isDatabaseConfigured()) {
    return reply({ error: "AYURE storage is temporarily unavailable.", code: "backend_not_configured" }, 503);
  }
  const receipt = `ayure-join-${randomUUID()}`;
  try {
    const saved = await insertAyureLead({ role: role as AyureLeadRole, name, email, goal, receipt });
    return reply({ ok: true, receipt: saved.receipt }, 200);
  } catch {
    // No PII, credentials, or raw driver errors in public responses.
    return reply({ error: "We could not save your application. Please try again.", code: "storage_error" }, 502);
  }
}
