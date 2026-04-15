"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "회원가입에 실패했습니다.");
      setLoading(false);
      return;
    }
    // Auto-login
    const loginRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (loginRes?.ok) window.location.href = "/";
    else setError("가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지로 이동해주세요.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-neutral-600 mb-1 block">이름 (선택)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-white hairline rounded-lg text-sm"
        />
      </div>
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
        <label className="text-xs text-neutral-600 mb-1 block">비밀번호 (6자 이상)</label>
        <input
          type="password"
          required
          minLength={6}
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
        {loading ? "처리 중..." : "가입하기"}
      </button>
    </form>
  );
}
