import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "아동 뉴스 센터",
  description: "아동 관련 최신 뉴스와 정책 동향을 한 곳에서",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="hairline-b bg-[var(--background)]">
          <div className="max-w-[880px] mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-medium text-lg">
              아동 뉴스 센터
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {session?.user ? (
                <>
                  <Link href="/bookmarks" className="text-neutral-700 hover:text-black">
                    북마크
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="text-neutral-700 hover:text-black">
                      관리자
                    </Link>
                  )}
                  <span className="text-neutral-500">
                    {session.user.name ?? session.user.email}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="text-neutral-700 hover:text-black cursor-pointer"
                    >
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-neutral-700 hover:text-black">
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200 hover:bg-indigo-100"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-[880px] w-full mx-auto px-6 py-6">{children}</main>
        <footer className="max-w-[880px] mx-auto px-6 py-6 text-xs text-neutral-400">
          © 아동 뉴스 센터 · AI로 수집한 뉴스를 제공합니다
        </footer>
      </body>
    </html>
  );
}
