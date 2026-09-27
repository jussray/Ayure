import { NextResponse } from "next/server";
import { createIntentFingerprint } from "../../../lib/ayure/fingerprint";
import { matchCatalog, parseIntent } from "../../../lib/ayure/intent";
import type { IntentKind } from "../../../lib/ayure/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { query?: string; intent?: IntentKind };
  try {
    payload = (await request.json()) as { query?: string; intent?: IntentKind };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = payload.query?.trim() ?? "";
  const explicit = payload.intent;
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
