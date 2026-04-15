import Link from "next/link";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="max-w-[400px] mx-auto py-8">
      <h1 className="text-xl font-medium mb-1">회원가입</h1>
      <p className="text-sm text-neutral-500 mb-6">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-indigo-900 underline">
          로그인
        </Link>
      </p>
      <SignupForm />
    </div>
  );
}
