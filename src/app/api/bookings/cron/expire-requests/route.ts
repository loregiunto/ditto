import { NextResponse } from "next/server";
import { expireStaleRequests } from "@/lib/bookings/expiration";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (bearer === secret) return true;
  const url = new URL(request.url);
  return url.searchParams.get("token") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expireStaleRequests();
  return NextResponse.json({ ok: true, ...result });
}
