"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { ReflectionSummary, RoadmapGoal } from "@/types/roadmap";

type ActiveTab = "roadmaps" | "resources" | "bookmarked";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function progressOf(goal: RoadmapGoal) {
  if (goal.steps.length === 0) {
    return 0;
  }

  const completed = goal.steps.filter((step) => step.status === "DONE").length;
  return Math.round((completed / goal.steps.length) * 100);
}

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("roadmaps");
  const [searchTerm, setSearchTerm] = useState("");
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [reflections, setReflections] = useState<ReflectionSummary[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadVaultData() {
      try {
        const [goalsResponse, reflectionsResponse] = await Promise.all([
          fetch("/api/roadmaps"),
          fetch("/api/reflections"),
        ]);

        if (!goalsResponse.ok || !reflectionsResponse.ok) {
          throw new Error("보관소 데이터를 불러오지 못했습니다.");
        }

        const goalsData = (await goalsResponse.json()) as { goals: RoadmapGoal[] };
        const reflectionsData = (await reflectionsResponse.json()) as { reflections: ReflectionSummary[] };

        if (!ignore) {
          setGoals(goalsData.goals);
          setReflections(reflectionsData.reflections);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : "보관소 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadVaultData();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredGoals = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (activeTab !== "roadmaps") {
      return [];
    }

    return goals.filter((goal) => goal.title.toLowerCase().includes(keyword));
  }, [activeTab, goals, searchTerm]);

  const filteredReflections = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (activeTab === "roadmaps") {
      return [];
    }

    return reflections.filter((reflection) => {
      const matchesKeyword =
        reflection.markdown.toLowerCase().includes(keyword) ||
        reflection.memo.toLowerCase().includes(keyword) ||
        (reflection.goalTitle?.toLowerCase().includes(keyword) ?? false);

      if (activeTab === "bookmarked") {
        return bookmarkedIds[reflection.id] && matchesKeyword;
      }

      return matchesKeyword;
    });
  }, [activeTab, bookmarkedIds, reflections, searchTerm]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />


      <main className="pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-3xl mx-auto w-full min-h-screen">
        <header className="mb-10">
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-on-surface mb-2">
            회고 보관소
          </h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg">
            실제 DB에 저장된 업무 분석과 회고 피드백을 관리하세요.
          </p>
        </header>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/30 mb-8 gap-4">
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide">
            {(
              [
                { id: "roadmaps", label: "업무 아카이브" },
                { id: "resources", label: "회고 피드백" },
                { id: "bookmarked", label: "북마크" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold transition-all border-b-2 text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-64 bg-surface-container-high rounded-full px-4 py-1.5 border border-outline-variant/30 mb-2 md:mb-0">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder-on-surface-variant w-full outline-none"
              placeholder="보관소 검색..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {error ? <p className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="rounded-xl border border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant bg-surface-container/10">
            저장된 데이터를 불러오는 중입니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-gutter">
            {activeTab === "roadmaps" && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">folder_open</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">보관된 업무 분석</h3>
                </div>

                {filteredGoals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant bg-surface-container/10">
                    저장된 업무 분석이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredGoals.map((goal) => {
                      const completed = goal.steps.filter((step) => step.status === "DONE").length;
                      const progress = progressOf(goal);

                      return (
                        <div
                          key={goal.id}
                          className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 hover:border-primary/50 transition-colors shadow-sm"
                        >
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                업무 분석
                              </span>
                              <h4 className="font-bold text-lg mt-2 text-on-surface">{goal.title}</h4>
                            </div>
                            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
                              {goal.steps.length}단계
                            </span>
                          </div>
                          <div className="flex gap-3 items-center mt-6">
                            <div className="h-1.5 flex-1 bg-outline-variant/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-primary">{progress}%</span>
                          </div>
                          <div className="flex justify-between items-center mt-3 text-xs text-on-surface-variant font-medium">
                            <span>전체 {goal.steps.length}단계 중 {completed}단계 완료</span>
                            <Link href={`/roadmaps/${goal.id}`} className="text-primary hover:underline flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[14px]">autorenew</span>
                              다시 검토
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {(activeTab === "resources" || activeTab === "bookmarked") && (
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary">rate_review</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">저장된 회고 피드백</h3>
                </div>

                {filteredReflections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant bg-surface-container/10">
                    저장된 회고 피드백이 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredReflections.map((reflection) => (
                      <article
                        key={reflection.id}
                        className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 hover:border-secondary/50 transition-colors shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {formatDate(reflection.createdAt)}
                            </span>
                            <h4 className="font-bold text-base text-on-surface mt-2">
                              {reflection.goalTitle ?? "독립 회고"}
                            </h4>
                          </div>
                          <button
                            onClick={() => toggleBookmark(reflection.id)}
                            className="text-on-surface-variant hover:text-primary transition-colors"
                            type="button"
                          >
                            <span
                              className="material-symbols-outlined text-[20px]"
                              style={bookmarkedIds[reflection.id] ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                              bookmark
                            </span>
                          </button>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{reflection.memo}</p>
                        <pre className="mt-4 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-container-lowest p-4 text-xs leading-5 text-on-surface">
                          {reflection.markdown}
                        </pre>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
