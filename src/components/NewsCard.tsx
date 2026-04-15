import Link from "next/link";
import { CATEGORY_BADGE, CATEGORY_LABEL, toCategoryCode } from "@/lib/categories";

interface Props {
  article: {
    id: string;
    title: string;
    summary: string;
    category: string;
    source: string;
    publishedAt: Date | string;
  };
  read?: boolean;
  bookmarked?: boolean;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function NewsCard({ article, read, bookmarked }: Props) {
  const code = toCategoryCode(article.category);
  return (
    <Link
      href={`/news/${article.id}`}
      className="block bg-white hairline rounded-xl px-5 py-4 hover:border-neutral-400 transition-colors"
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ring-1 font-medium ${CATEGORY_BADGE[code]}`}
          >
            {CATEGORY_LABEL[code]}
          </span>
          {bookmarked && (
            <span className="text-[11px] text-amber-700" title="북마크됨">
              ★ 북마크
            </span>
          )}
          {read && (
            <span className="text-[11px] text-neutral-400" title="읽음">
              · 읽음
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {formatDate(article.publishedAt)}
        </span>
      </div>
      <h3 className={`text-[15px] font-medium leading-normal mb-1.5 ${read ? "text-neutral-500" : ""}`}>
        {article.title}
      </h3>
      <p className="text-[13px] text-neutral-600 leading-relaxed line-clamp-3">{article.summary}</p>
      <div className="text-xs text-neutral-400 mt-2.5">{article.source}</div>
    </Link>
  );
}
