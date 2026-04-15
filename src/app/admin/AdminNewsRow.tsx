"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_BADGE, CATEGORY_LABEL, toCategoryCode } from "@/lib/categories";

export default function AdminNewsRow({
  article,
}: {
  article: {
    id: string;
    title: string;
    category: string;
    source: string;
    publishedAt: string;
    published: boolean;
  };
}) {
  const router = useRouter();
  const [published, setPublished] = useState(article.published);
  const [isPending, startTransition] = useTransition();
  const code = toCategoryCode(article.category);

  async function togglePublished() {
    const res = await fetch(`/api/news/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    if (res.ok) {
      setPublished(!published);
      startTransition(() => router.refresh());
    }
  }

  async function del() {
    if (!confirm("정말로 삭제하시겠어요?")) return;
    const res = await fetch(`/api/news/${article.id}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => router.refresh());
    }
  }

  const date = new Date(article.publishedAt).toLocaleDateString("ko-KR");

  return (
    <div className={`p-4 flex items-center gap-3 ${!published ? "opacity-50" : ""}`}>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ring-1 font-medium shrink-0 ${CATEGORY_BADGE[code]}`}>
        {CATEGORY_LABEL[code]}
      </span>
      <div className="flex-1 min-w-0">
        <Link href={`/news/${article.id}`} className="text-sm hover:underline block truncate">
          {article.title}
        </Link>
        <div className="text-xs text-neutral-400 mt-0.5">
          {article.source} · {date}
        </div>
      </div>
      <button
        onClick={togglePublished}
        disabled={isPending}
        className="text-xs px-2.5 py-1 rounded-md ring-1 ring-black/15 hover:bg-[#f0efe8] cursor-pointer"
      >
        {published ? "숨김" : "게시"}
      </button>
      <button
        onClick={del}
        disabled={isPending}
        className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 cursor-pointer"
      >
        삭제
      </button>
    </div>
  );
}
