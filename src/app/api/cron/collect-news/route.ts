import { NextResponse } from "next/server";
import { collectAndStoreNews } from "@/lib/anthropic";

export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  // Vercel Cron adds this header automatically with the value `Bearer ${CRON_SECRET}`
  // For manual dev triggering, accept either x-cron-secret or Authorization: Bearer ...
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await collectAndStoreNews();
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  return GET(req);
}
