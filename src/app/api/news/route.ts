import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORY_CODES, toCategoryCode } from "@/lib/categories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category");
  const take = Math.min(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 100);

  const where: Record<string, unknown> = { published: true };
  if (categoryParam && categoryParam !== "ALL" && categoryParam !== "전체") {
    const code = toCategoryCode(categoryParam);
    if ((CATEGORY_CODES as readonly string[]).includes(code)) where.category = code;
  }

  const articles = await prisma.newsArticle.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take,
  });

  return NextResponse.json({ articles });
}
