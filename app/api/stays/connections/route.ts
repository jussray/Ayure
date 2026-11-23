import { NextResponse } from "next/server";
import { resolveStayConnections, validateStaySearch } from "../../../../lib/ayure/stay-adapters";

export const runtime = "nodejs";
const MAX_BYTES = 4096;

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  let input: unknown;
  try { input = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  try {
    const search = validateStaySearch(input);
    return NextResponse.json({
      search,
      channels: resolveStayConnections(search),
      inventory: "not_available",
      booking: "external_provider_only",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid search." }, { status: 400 });
  }
}
