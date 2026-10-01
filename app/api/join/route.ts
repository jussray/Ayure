import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { insertAyureLead, type AyureLeadRole } from "../../../lib/db/ayure-leads";
import { isDatabaseConfigured } from "../../../lib/db/pool";

const roles = new Set<AyureLeadRole>(["buyer", "owner", "investor", "operator", "service_provider"]);
const MAX_BODY_BYTES = 16_384;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_GOAL_LENGTH = 2_000;

function validEmail(value: string) {
  return value.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function bodyTooLarge(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (bodyTooLarge(request)) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let payload: { role?: string; name?: string; email?: string; goal?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const role = payload.role?.trim() ?? "";
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const goal = payload.goal?.trim() ?? "";

  const invalidFields =
    !roles.has(role as AyureLeadRole) ||
    name.length < 2 ||
    name.length > MAX_NAME_LENGTH ||
    !validEmail(email) ||
    goal.length < 8 ||
    goal.length > MAX_GOAL_LENGTH;

  if (invalidFields) {
    return NextResponse.json(
      { error: "Choose a role and provide a valid name, email, and concise description of what you want to make happen." },
      { status: 400 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "AYURE applications are not connected to storage yet.", code: "backend_not_configured" },
      { status: 503 },
    );
  }

  const receipt = `ayure-join-${randomUUID()}`;

  try {
    const persisted = await insertAyureLead({
      role: role as AyureLeadRole,
      name,
      email,
      goal,
      receipt,
    });

    return NextResponse.json({ ok: true, receipt: persisted.receipt });
  } catch {
    return NextResponse.json(
      { error: "We could not save your application. Please try again.", code: "storage_error" },
      { status: 502 },
    );
  }
}
