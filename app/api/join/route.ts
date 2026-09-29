import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const roles = new Set(["buyer", "owner", "investor", "operator", "service_provider"]);
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
    !roles.has(role) ||
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

  const supabaseUrl = process.env.AYURE_SUPABASE_URL;
  const serviceRoleKey = process.env.AYURE_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "AYURE applications are not connected to storage yet.", code: "backend_not_configured" },
      { status: 503 },
    );
  }

  const receipt = `ayure-join-${randomUUID()}`;
  const upstream = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/ayure_leads`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ role, name, email, goal, receipt, status: "new" }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "We could not save your application. Please try again.", code: "storage_error" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, receipt });
}
