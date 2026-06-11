"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { callApi } from "@/lib/api-utils";
import type { RoadmapGoal } from "@/types/roadmap";

export default function BreakdownPage() {
  const router = useRouter();
  const [goalInput, setGoalInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const placeholders = useMemo(
    () => [
      "예: 바디프로필 촬영을 위한 일주일 식단 구성 및 장보기",
      "예: 하프 마라톤 완주를 위한 단계별 달성 계획 설계",
      "예: 미니멀 라이프 실천을 위한 안 입는 옷 정리하기",
      "예: 월 2권 독서 달성을 위한 매일 독서 루틴 짜기",
      "예: 주말 아침 러닝 및 스트레칭 습관 만들기",
      "예: 건강한 식생활을 위한 저염식 반찬 밀프렙 준비",
    ],
    [],
  );
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [placeholders]);

  

  async function createRoadmap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalInput.trim()) {
      setError("구체화할 업무 목표를 입력해 주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 입력 화면은 생성까지만 담당하고, 결과 관리는 로드맵 상세 화면으로 넘깁니다.
      const data = await callApi<{ goal: RoadmapGoal }>("/api/roadmaps", {
        method: "POST",
        body: JSON.stringify({
          goal: goalInput.trim(),
          context: contextInput.trim() || undefined,
        }),
      });
      router.push(`/roadmaps/${data.goal.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 구체화에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#f2f4f6] dark:bg-[#121212] text-[#191f28] dark:text-[#f5f5f7] min-h-screen relative overflow-hidden">
      <Header />

      <main className="relative z-10 pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-4xl mx-auto w-full min-h-screen">
        <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-start">
          <div className="space-y-6">
            <div>
              <span className="text-primary font-bold font-label-md text-label-md tracking-widest uppercase">
                업무 목표 구체화
              </span>
              <h1 className="font-headline-lg text-headline-lg mt-2 text-on-background break-keep">
                목표 설정하기
              </h1>
            </div>

            <form onSubmit={createRoadmap} className="glass-card rounded-3xl p-5 md:p-6 shadow-md space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor="goal">
                  구체화할 업무
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" aria-hidden="true">
                    search
                  </span>
                  <input
                    id="goal"
                    className="w-full pl-12 pr-4 h-12 bg-white/70 dark:bg-surface-container-high/60 backdrop-blur-sm border border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-[#e0fdf4]/10 focus:border-transparent font-body-medium text-body-medium text-on-surface"
                    type="text"
                    value={goalInput}
                    onChange={(event) => setGoalInput(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                  {!goalInput && !isFocused && (
                    <div
                      key={placeholderIndex}
                      className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none font-body-medium text-body-medium text-outline/70 animate-placeholder-in truncate pr-4 max-w-[calc(100%-3.5rem)]"
                    >
                      {placeholders[placeholderIndex]}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor="context">
                  추가 맥락 <span className="font-medium text-on-surface-variant">(선택)</span>
                </label>
                <textarea
                  id="context"
                  className="min-h-32 w-full resize-none rounded-xl border border-primary/30 bg-white/70 p-4 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:bg-[#e0fdf4]/10"
                  value={contextInput}
                  onChange={(event) => setContextInput(event.target.value)}
                  placeholder="마감일, 현재 상태, 제약 조건, 원하는 결과물을 적으면 더 현실적인 업무 단위로 쪼갤 수 있습니다."
                />
              </div>

              {error ? (
                <p className="rounded-md bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error font-medium">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/work"
                  className="text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  이미 만든 업무 보러가기
                </Link>
                <button
                  disabled={loading}
                  className="bg-primary text-white px-6 h-12 rounded-xl font-bold text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  type="submit"
                >
                  {loading ? "구체화 중..." : "업무 구체화"}
                </button>
              </div>
            </form>
          </div>

          <aside id="roadmap-list-section" className="scroll-mt-24 glass-card rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">account_tree</span>
              <h2 className="font-headline-md text-headline-md text-on-surface">이렇게 진행돼요</h2>
            </div>
            <div className="space-y-4 text-sm leading-6 text-on-surface-variant">
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-800/40 border border-outline-variant/30 dark:border-neutral-700/50 p-4">
                <p className="font-bold text-on-surface dark:text-[#f5f5f7]">1. 이 화면에서 생성</p>
                <p className="mt-1 text-on-surface-variant dark:text-[#a9abb6]">추상적인 업무와 맥락만 입력해 실행 가능한 단계로 변환합니다.</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-800/40 border border-outline-variant/30 dark:border-neutral-700/50 p-4">
                <p className="font-bold text-on-surface dark:text-[#f5f5f7]">2. 상세 화면에서 실행</p>
                <p className="mt-1 text-on-surface-variant dark:text-[#a9abb6]">생성된 단계 목록을 보고 완료, 추가 구체화, 회고 피드백을 처리합니다.</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-neutral-800/40 border border-outline-variant/30 dark:border-neutral-700/50 p-4">
                <p className="font-bold text-on-surface dark:text-[#f5f5f7]">3. 내 업무에서 한눈에 확인</p>
                <p className="mt-1 text-on-surface-variant dark:text-[#a9abb6]">현재 진행 중인 작업과 캘린더 일정을 함께 확인합니다.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
