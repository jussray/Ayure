import { NextResponse } from "next/server";
import { createIntentFingerprint } from "../../../lib/ayure/fingerprint";
import { matchCatalog, parseIntent } from "../../../lib/ayure/intent";
import type { IntentKind } from "../../../lib/ayure/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;
const MAX_QUERY_LENGTH = 500;
const intentKinds = new Set<IntentKind>([
  "explore",
  "buy",
  "find_operator",
  "transform",
  "invest",
  "offer_services",
]);

function bodyTooLarge(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES;
}

export async function POST(request: Request) {
  if (bodyTooLarge(request)) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let payload: { query?: unknown; intent?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (payload.query !== undefined && typeof payload.query !== "string") {
    return NextResponse.json({ error: "Search query must be text." }, { status: 400 });
  }
  if (payload.intent !== undefined && (typeof payload.intent !== "string" || !intentKinds.has(payload.intent as IntentKind))) {
    return NextResponse.json({ error: "Unsupported AYURE intent." }, { status: 400 });
  }

  const query = (payload.query as string | undefined)?.trim() ?? "";
  const explicit = payload.intent as IntentKind | undefined;
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Keep your search under 500 characters." }, { status: 400 });
  }
  if (!query && !explicit) {
    return NextResponse.json({ error: "Tell AYURE what you want to make happen." }, { status: 400 });
  }

  const intent = parseIntent(query || explicit || "explore", explicit);
  const fingerprint = createIntentFingerprint(intent);
  const results = matchCatalog(intent);

  const response = NextResponse.json({
    intent,
    fingerprint,
    results,
    meta: {
      catalogMode: "example",
      proofPolicy: ["example", "projected", "reported", "verified"],
    },
  });

  response.cookies.set("ayure_intent", fingerprint, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.headers.set("X-Ayure-Intent-Fingerprint", fingerprint);

  return response;
}
