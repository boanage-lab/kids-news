import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import NewsCard from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/bookmarks");

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { article: true },
  });

  return (
    <div>
      <h1 className="text-xl font-medium mb-1">내 북마크</h1>
      <p className="text-sm text-neutral-500 mb-6">저장한 뉴스 {bookmarks.length}건</p>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          아직 북마크한 뉴스가 없습니다.
        </div>
      ) : (
        <div className="grid gap-3">
          {bookmarks.map(({ article }) => (
            <NewsCard key={article.id} article={article} bookmarked />
          ))}
        </div>
      )}
    </div>
  );
}
