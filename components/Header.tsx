"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButtons from "@/components/AuthButtons";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface shadow-sm border-b border-outline-variant flex justify-between items-center px-6 md:px-margin-desktop h-16">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
          FocusFlow
        </Link>
        <nav className="hidden md:flex gap-6 ml-8">
          <Link
            href="/breakdown"
            className={`font-label-md text-label-md pb-1 p-1 rounded transition-colors ${
              pathname === "/breakdown" || pathname.startsWith("/roadmaps/")
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant font-medium hover:bg-surface-container-low"
            }`}
          >
            업무 구체화
          </Link>
          <Link
            href="/work"
            className={`font-label-md text-label-md pb-1 p-1 rounded transition-colors ${
              pathname === "/work"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant font-medium hover:bg-surface-container-low"
            }`}
          >
            내 업무
          </Link>
          <Link
            href="/insights"
            className={`font-label-md text-label-md pb-1 p-1 rounded transition-colors ${
              pathname === "/insights"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant font-medium hover:bg-surface-container-low"
            }`}
          >
            작업 피드백
          </Link>
          <Link
            href="/vault"
            className={`font-label-md text-label-md pb-1 p-1 rounded transition-colors ${
              pathname === "/vault"
                ? "text-primary font-bold border-b-2 border-primary"
                : "text-on-surface-variant font-medium hover:bg-surface-container-low"
            }`}
          >
            회고 보관소
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <AuthButtons />
        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
          notifications
        </span>
        <Link href="/settings" className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
          settings
        </Link>
      </div>
    </header>
  );
}
