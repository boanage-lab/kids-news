import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CATEGORY_CODES, toCategoryCode } from "@/lib/categories";
import CategoryFilter from "@/components/CategoryFilter";
import NewsCard from "@/components/NewsCard";
import RefreshNewsButton from "@/components/RefreshNewsButton";

export const dynamic = "force-dynamic";

type Search = Promise<{ category?: string }>;

export default async function Home({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const session = await auth();

  const where: Record<string, unknown> = { published: true };
  if (sp.category && sp.category !== "ALL" && sp.category !== "전체") {
    const code = toCategoryCode(sp.category);
    if ((CATEGORY_CODES as readonly string[]).includes(code)) where.category = code;
  }

  const articles = await prisma.newsArticle.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  let bookmarkedIds = new Set<string>();
  let readIds = new Set<string>();
  if (session?.user?.id) {
    const [bms, rds] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId: session.user.id,
          articleId: { in: articles.map((a) => a.id) },
        },
        select: { articleId: true },
      }),
      prisma.readLog.findMany({
        where: {
          userId: session.user.id,
          articleId: { in: articles.map((a) => a.id) },
        },
        select: { articleId: true },
      }),
    ]);
    bookmarkedIds = new Set(bms.map((b) => b.articleId));
    readIds = new Set(rds.map((r) => r.articleId));
  }

  const total = await prisma.newsArticle.count({ where: { published: true } });

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-neutral-500">
          AI가 수집한 {total}건의 아동 관련 뉴스를 확인하세요
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <CategoryFilter />
        <RefreshNewsButton />
      </div>

      <div className="text-xs text-neutral-400 mb-3">총 {articles.length}건 표시</div>

      {articles.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          해당 조건의 뉴스가 없습니다.
          <br />
          <span className="text-xs text-neutral-400">
            상단의 새로고침을 눌러 AI 수집을 시작해보세요.
          </span>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((a) => (
            <NewsCard
              key={a.id}
              article={a}
              read={readIds.has(a.id)}
              bookmarked={bookmarkedIds.has(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
