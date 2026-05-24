"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    try {
      setGuestLoading(true);
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        alert("게스트 로그인에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      console.error(err);
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setGuestLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* 백그라운드 리퀴드 글래스 블롭 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px] animate-blob-1" />
        <div className="absolute top-[25%] right-[15%] w-[450px] h-[450px] rounded-full bg-secondary/8 blur-[100px] animate-blob-2" />
        <div className="absolute bottom-[20%] left-[25%] w-[380px] h-[380px] rounded-full bg-primary/8 blur-[90px] animate-blob-3" />
      </div>

      {/* 헤더 */}
      <header className="relative z-10 w-full px-6 md:px-margin-desktop h-16 flex items-center">
        <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
          FocusFlow
        </Link>
      </header>

      {/* 중앙 로그인 카드 */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-8 rounded-2xl flex flex-col items-center text-center shadow-xl border border-outline-variant/30">
          <h1 className="font-display-md text-2xl md:text-3xl font-bold tracking-tight text-on-surface mb-3 break-keep">
            FocusFlow에 오신 것을 환영합니다
          </h1>
          <p className="text-on-surface-variant font-body-medium text-sm md:text-base leading-relaxed mb-8 max-w-sm break-keep">
            로그인하시면 AI 업무 구체화 설계 결과와 일일 회고 피드백을 영구적으로 저장하고 관리하실 수 있습니다.
          </p>

          {/* 구글 로그인 버튼 */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex items-center justify-center gap-3 w-full max-w-sm h-12 px-6 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {/* 구글 G 로고 SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google 계정으로 로그인</span>
          </button>

          {/* 게스트 로그인 버튼 */}
          <button
            onClick={handleGuestLogin}
            disabled={guestLoading}
            className="mt-3 flex items-center justify-center gap-2 w-full max-w-sm h-11 px-6 font-medium text-sm text-on-surface-variant bg-surface-container border border-outline-variant/30 rounded-lg shadow-sm hover:bg-surface-container-high hover:border-outline-variant active:scale-98 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              person_outline
            </span>
            <span>{guestLoading ? "게스트 계정 준비 중..." : "게스트 모드로 간편 체험하기"}</span>
          </button>

          <Link href="/" className="mt-6 text-xs text-on-surface-variant hover:text-primary transition-colors underline">
            홈으로 돌아가기
          </Link>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-on-surface-variant/60">
        © 2026 FocusFlow. All rights reserved.
      </footer>
    </div>
  );
}
