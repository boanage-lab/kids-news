import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CATEGORY_CODES } from "@/lib/categories";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  if (!article || !article.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ article });
}

const PatchBody = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().optional(),
  detail: z.string().optional(),
  impact: z.string().optional(),
  point: z.string().optional(),
  category: z.enum(CATEGORY_CODES).optional(),
  source: z.string().optional(),
  url: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const article = await prisma.newsArticle.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ article });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.newsArticle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
