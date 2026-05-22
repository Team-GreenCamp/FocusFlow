"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "업무 구체화", path: "/breakdown", icon: "account_tree" },
    { name: "집중 타이머", path: "/deep-work", icon: "checklist" },
    { name: "작업 피드백", path: "/insights", icon: "rate_review" },
    { name: "회고 보관소", path: "/vault", icon: "inventory_2" },
    { name: "설정", path: "/settings", icon: "settings" },
  ];

  return (
    <>
      {/* 마우스 접근 감지용 투명 영역 (화면 왼쪽 가장자리 16px) */}
      <div
        className="fixed left-0 top-0 w-4 h-full z-40 hidden md:block"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* 인터랙티브 사이드바 (리퀴드 글래스 컨셉 적용) */}
      <aside
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white/10 dark:bg-black/30 backdrop-blur-2xl flex flex-col p-gutter pb-16 gap-unit hidden md:flex border-r border-white/20 dark:border-white/10 transition-all duration-300 ease-out z-50 shadow-[0_8px_32px_0_rgba(0,65,200,0.15)] ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">업무 분석</h2>
          <p className="font-label-md text-label-md text-on-surface-variant opacity-70">구체화와 회고</p>
        </div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-95 duration-200 text-left border ${
                  isActive
                    ? "bg-secondary-container/80 text-on-secondary-container border-secondary/20 font-semibold shadow-sm"
                    : "text-on-surface-variant hover:bg-white/15 dark:hover:bg-white/5 border-transparent"
                }`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                <span className="font-label-md text-label-md">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Link
            href="/breakdown"
            className="w-full text-center block momentum-gradient text-white py-4 rounded-xl font-label-md text-label-md shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all font-bold"
          >
            새 업무 구체화 시작
          </Link>
        </div>
      </aside>
    </>
  );
}
