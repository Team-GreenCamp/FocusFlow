"use client";

import Link from "next/link";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

export default function Home() {
  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-hidden">
      {/* 백그라운드 리퀴드 글래스 블롭 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px] animate-blob-1" />
        <div className="absolute top-[25%] right-[15%] w-[450px] h-[450px] rounded-full bg-secondary/8 blur-[100px] animate-blob-2" />
        <div className="absolute bottom-[20%] left-[25%] w-[380px] h-[380px] rounded-full bg-primary/8 blur-[90px] animate-blob-3" />
      </div>

      {/* Header */}
      <Header />



      {/* Main Content Canvas */}
      <main className="relative z-10 pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-5xl mx-auto w-full min-h-screen flex flex-col items-center">
        
        {/* Landing Hero Section */}
        <section className="w-full text-center py-16 md:py-24 flex flex-col items-center justify-center border-b border-outline-variant/20 mb-16 relative">
          <h1 className="font-display-lg text-4xl md:text-6xl font-bold tracking-tight text-on-surface max-w-3xl leading-tight mb-6 break-keep">
            뇌의 인지 과부하를 비우고 <br />
            <span className="momentum-gradient">몰입의 흐름</span>에 올라타세요
          </h1>
          <p className="text-on-surface-variant font-body-lg text-lg md:text-xl max-w-2xl leading-relaxed mb-10 break-keep">
            복잡하고 막연한 머릿속 업무 아이디어를 즉시 실행 가능한 마이크로 태스크로 세분화합니다. 집중을 유지하고 일일 회고 루프를 완성하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link
              href="/breakdown"
              className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 duration-200"
            >
              지금 시작하기
            </Link>
            <Link
              href="/deep-work"
              className="px-8 py-4 bg-white/15 dark:bg-black/25 backdrop-blur-md border border-outline-variant/30 text-on-surface font-semibold rounded-xl hover:bg-white/20 transition-all hover:scale-105 active:scale-95 duration-200"
            >
              실행 기록 보기
            </Link>
          </div>
        </section>

        {/* Features Info Section */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">인지 과부하 완화</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
              추상적이고 막막한 목표를 논리적 순서를 갖춘 세부 태스크로 세분화하여, 시작 전 뇌의 의사결정 에너지를 절약합니다.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-secondary text-2xl">bolt</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">몰입형 뽀모도로</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
              한 번에 단 하나의 구체화된 업무에만 오롯이 몰입하도록 유도하며, 인지 상태를 최적으로 유지해주는 집중 타겟 가이드를 제공합니다.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-2xl">loop</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-3">피드백 기반 성장</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
              실제 수행한 업무의 완수 내역과 단기 메모를 하나로 모아 심층 회고 피드백을 생성함으로써, 명확한 내일의 개선점을 제안합니다.
            </p>
          </div>
        </section>
      </main>

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
