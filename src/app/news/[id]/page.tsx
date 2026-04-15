import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CATEGORY_BADGE, CATEGORY_LABEL, toCategoryCode } from "@/lib/categories";
import BookmarkToggle from "@/components/BookmarkToggle";
import ReadTracker from "@/components/ReadTracker";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function NewsDetail({ params }: { params: Params }) {
  const { id } = await params;
  const article = await prisma.newsArticle.findUnique({ where: { id } });
  if (!article || !article.published) notFound();

  const session = await auth();
  let bookmarked = false;
  if (session?.user?.id) {
    const bm = await prisma.bookmark.findUnique({
      where: { userId_articleId: { userId: session.user.id, articleId: id } },
    });
    bookmarked = !!bm;
  }

  const code = toCategoryCode(article.category);
  const dateStr = article.publishedAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="max-w-[720px] mx-auto">
      {session?.user && <ReadTracker articleId={article.id} />}

      <Link href="/" className="text-sm text-neutral-500 hover:text-black mb-4 inline-block">
        ← 목록으로
      </Link>

      <div className="bg-white hairline rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ring-1 font-medium ${CATEGORY_BADGE[code]}`}
          >
            {CATEGORY_LABEL[code]}
          </span>
          {session?.user && <BookmarkToggle articleId={article.id} initial={bookmarked} />}
        </div>

        <h1 className="text-xl md:text-2xl font-medium leading-normal mb-2">{article.title}</h1>
        <div className="text-xs text-neutral-400 mb-6">
          {article.source} · {dateStr}
        </div>

        <hr className="border-0 border-t border-black/10 my-4" />

        <p className="text-[14px] text-neutral-800 leading-loose whitespace-pre-line">
          {article.detail || article.summary}
        </p>

        {article.impact && (
          <div className="mt-5 rounded-lg bg-[#f0efe8] p-4">
            <div className="text-[11px] font-medium text-neutral-500 mb-1.5">현장 영향</div>
            <div className="text-[13px] leading-loose text-neutral-700">{article.impact}</div>
          </div>
        )}

        {article.point && (
          <div className="mt-3 rounded-lg bg-indigo-50 p-4">
            <div className="text-[11px] font-medium text-indigo-900 mb-1.5">핵심 포인트</div>
            <div className="text-[13px] leading-loose font-medium text-indigo-900">
              {article.point}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-neutral-500">
            <span className="text-neutral-700 font-medium">출처</span> {article.source} &middot;{" "}
            <span className="text-neutral-700 font-medium">발행일</span> {dateStr}
          </div>
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full bg-sky-50 text-sky-900 ring-1 ring-sky-200 hover:bg-sky-100 font-medium"
            >
              원문 보기 →
            </a>
          ) : (
            <a
              href={`https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(
                `${article.title} ${article.source}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-200 font-medium"
              title="원문 URL이 없어 네이버 뉴스 검색으로 연결됩니다"
            >
              네이버에서 원문 찾기 →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
