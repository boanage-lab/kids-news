"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm({
  callbackUrl,
  error: initialError,
  hasGoogle,
}: {
  callbackUrl?: string;
  error?: string;
  hasGoogle: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    initialError ? "로그인 오류가 발생했습니다." : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/",
    });
    setLoading(false);
    if (res?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    if (res?.ok) {
      window.location.href = callbackUrl ?? "/";
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-neutral-600 mb-1 block">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white hairline rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-600 mb-1 block">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-white hairline rounded-lg text-sm"
          />
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-lg bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-sm font-medium cursor-pointer"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {hasGoogle && (
        <>
          <div className="text-center text-xs text-neutral-400 my-5">또는</div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: callbackUrl ?? "/" })}
            className="w-full px-3 py-2 rounded-lg bg-white ring-1 ring-black/15 hover:bg-[#f0efe8] text-sm cursor-pointer"
          >
            Google로 로그인
          </button>
        </>
      )}
    </>
  );
}
