import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import AdminNewsRow from "./AdminNewsRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [articles, userCount, bookmarkCount, verifiedCount] = await Promise.all([
    prisma.newsArticle.findMany({
      orderBy: { collectedAt: "desc" },
      take: 100,
    }),
    prisma.user.count(),
    prisma.bookmark.count(),
    prisma.newsArticle.count({ where: { verified: true } }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-medium mb-1">관리자</h1>
      <p className="text-sm text-neutral-500 mb-6">
        뉴스 검수 · 숨김 · 삭제 및 시스템 현황
      </p>

      <div className="grid grid-cols-4 gap-3 mb-8">
        <Stat label="뉴스 총량" value={articles.length} />
        <Stat label="검증된 뉴스" value={verifiedCount} />
        <Stat label="사용자" value={userCount} />
        <Stat label="북마크" value={bookmarkCount} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium">뉴스 목록 (최근 100건)</h2>
        <Link href="/api/cron/collect-news" className="text-xs text-neutral-500 underline">
          수집 엔드포인트
        </Link>
      </div>

      <div className="bg-white hairline rounded-xl divide-y divide-black/5">
        {articles.map((a) => (
          <AdminNewsRow key={a.id} article={{
            id: a.id,
            title: a.title,
            category: a.category,
            source: a.source,
            publishedAt: a.publishedAt.toISOString(),
            published: a.published,
            verified: a.verified,
          }} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white hairline rounded-xl p-4">
      <div className="text-xs text-neutral-500 mb-1">{label}</div>
      <div className="text-2xl font-medium">{value}</div>
    </div>
  );
}
