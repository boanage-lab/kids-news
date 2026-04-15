"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshNewsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function trigger() {
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/cron/collect-news", {
        method: "POST",
        headers: { "x-cron-secret": getDevSecret() },
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(`수집 실패: ${data.error ?? "알 수 없는 오류"}`);
      } else if (!data.ok) {
        setMsg(`수집 실패: ${data.error ?? "API 키가 설정되지 않았을 수 있습니다"}`);
      } else {
        setMsg(`${data.inserted}건 추가 · ${data.skipped}건 중복/무시`);
        router.refresh();
      }
    } catch (e) {
      setMsg(`요청 오류: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 5000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={trigger}
        disabled={loading}
        className="text-sm px-3 py-1.5 rounded-lg ring-1 ring-black/15 bg-transparent hover:bg-[#f0efe8] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
      >
        <span className={loading ? "inline-block animate-spin" : "inline-block"}>↻</span>
        새로고침
      </button>
      {msg && <span className="text-xs text-neutral-500">{msg}</span>}
    </div>
  );
}

// In dev, the cron secret is known from .env. In production, this button should
// be disabled/removed or restricted to admins with their own session-based trigger.
function getDevSecret(): string {
  return process.env.NEXT_PUBLIC_CRON_SECRET ?? "dev-cron-secret";
}
