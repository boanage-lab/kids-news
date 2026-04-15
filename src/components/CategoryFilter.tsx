"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_CODES, CATEGORY_LABEL } from "@/lib/categories";

const ITEMS = [
  { code: "ALL" as const, label: "전체" },
  ...CATEGORY_CODES.map((c) => ({ code: c, label: CATEGORY_LABEL[c] })),
];

export default function CategoryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("category") ?? "ALL";

  return (
    <div className="flex gap-2 flex-wrap">
      {ITEMS.map((it) => {
        const active = current === it.code;
        return (
          <button
            key={it.code}
            type="button"
            onClick={() => {
              const sp = new URLSearchParams(params);
              if (it.code === "ALL") sp.delete("category");
              else sp.set("category", it.code);
              router.push(`/?${sp.toString()}`);
            }}
            className={`text-xs px-3 py-1 rounded-full ring-1 transition-colors cursor-pointer ${
              active
                ? "bg-indigo-50 text-indigo-900 ring-indigo-200"
                : "bg-[#f0efe8] text-neutral-600 ring-black/10 hover:bg-[#e7e6df]"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
