import Link from "next/link";
import LoginForm from "./LoginForm";

type SP = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const hasGoogle = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

  return (
    <div className="max-w-[400px] mx-auto py-8">
      <h1 className="text-xl font-medium mb-1">로그인</h1>
      <p className="text-sm text-neutral-500 mb-6">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-indigo-900 underline">
          회원가입
        </Link>
      </p>

      <LoginForm callbackUrl={sp.callbackUrl} error={sp.error} hasGoogle={hasGoogle} />
    </div>
  );
}
