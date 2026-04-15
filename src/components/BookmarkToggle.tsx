"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function BookmarkToggle({
  articleId,
  initial,
}: {
  articleId: string;
  initial: boolean;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initial);
  const [isPending, startTransition] = useTransition();

  async function toggle() {
    const res = await fetch(`/api/news/${articleId}/bookmark`, { method: "POST" });
    if (res.status === 401) {
      router.push("/login?callbackUrl=/news/" + articleId);
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`text-sm px-3 py-1.5 rounded-lg ring-1 transition-colors cursor-pointer ${
        bookmarked
          ? "bg-amber-50 text-amber-900 ring-amber-200 hover:bg-amber-100"
          : "bg-white text-neutral-700 ring-black/15 hover:bg-[#f0efe8]"
      }`}
    >
      {bookmarked ? "★ 북마크됨" : "☆ 북마크"}
    </button>
  );
}
