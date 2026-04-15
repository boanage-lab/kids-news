import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: articleId } = await params;

  await prisma.readLog.upsert({
    where: { userId_articleId: { userId: session.user.id, articleId } },
    update: { readAt: new Date() },
    create: { userId: session.user.id, articleId },
  });
  return NextResponse.json({ ok: true });
}
