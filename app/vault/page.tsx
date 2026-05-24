"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { ReflectionSummary, RoadmapGoal } from "@/types/roadmap";

type ActiveTab = "roadmaps" | "resources" | "bookmarked";

interface ParsedSection {
  title: string;
  items: string[];
}

function parseMarkdown(md: string) {
  const sections: ParsedSection[] = [];
  const lines = md.split("\n");
  let currentSection: ParsedSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 헤더 매칭 (H1, H2, H3, H4 등 #으로 시작하는 행)
    if (trimmed.startsWith("#")) {
      const titleText = trimmed.replace(/^#+\s*/, "").trim();
      
      const isGlobalTitle = 
        trimmed.startsWith("# ") || 
        (titleText.includes("회고") && (trimmed.startsWith("## ") || titleText.endsWith("회고")));

      if (isGlobalTitle) {
        continue;
      }

      if (currentSection) {
        sections.push(currentSection);
      }
      
      const cleanedTitle = titleText
        .replace(/^[\p{Emoji}\u2000-\u2BFF\s]+/gu, "") // 이모지 제거
        .replace(/^#?\s*/, "") // 남은 샵 기호 제거
        .replace(/^\d+\.\s*/, "") // 리스트 번호 제거
        .trim();

      currentSection = {
        title: cleanedTitle,
        items: []
      };
      continue;
    }

    // 목록 항목 또는 일반 단락 매칭
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      if (currentSection) {
        currentSection.items.push(trimmed.replace(/^[-*]\s*/, "").trim());
      }
    } else {
      if (currentSection) {
        currentSection.items.push(trimmed);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function getSectionStyle(title: string) {
  const t = title.toLowerCase();
  if (t.includes("완료") || t.includes("수행") || t.includes("성공")) {
    return {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      border: "border-emerald-500/20 dark:border-emerald-500/30",
      icon: "check_circle",
      iconColor: "text-emerald-500",
      accentLine: "bg-emerald-500",
    };
  }
  if (t.includes("잘된") || t.includes("장점") || t.includes("칭찬") || t.includes("만족") || t.includes("피드백") || t.includes("반영")) {
    return {
      bg: "bg-sky-500/5 dark:bg-sky-500/10",
      border: "border-sky-500/20 dark:border-sky-500/30",
      icon: "auto_awesome",
      iconColor: "text-sky-500",
      accentLine: "bg-sky-500",
    };
  }
  return {
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-500/20 dark:border-amber-500/30",
    icon: "lightbulb",
    iconColor: "text-amber-500",
    accentLine: "bg-amber-500",
  };
}

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
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
                    {filteredReflections.map((reflection) => {
                      const isExpanded = !!expandedIds[reflection.id];
                      const sections = parseMarkdown(reflection.markdown);

                      return (
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

                          {/* 마크다운 파싱 결과 렌더링 및 접기/펴기 영역 */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              isExpanded ? "max-h-[1500px] opacity-100 mt-4" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="flex flex-col gap-4">
                              {sections.map((section, idx) => {
                                const style = getSectionStyle(section.title);
                                return (
                                  <div
                                    key={idx}
                                    className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-4 transition-all duration-300`}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accentLine}`} />
                                    
                                    <div className="flex items-center gap-2 mb-2 pl-1">
                                      <span className={`material-symbols-outlined ${style.iconColor} text-[18px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {style.icon}
                                      </span>
                                      <h5 className="font-bold text-on-surface text-xs md:text-sm">
                                        {section.title}
                                      </h5>
                                    </div>

                                    {section.items.length === 0 ? (
                                      <p className="text-xs text-on-surface-variant pl-6">기록된 항목이 없습니다.</p>
                                    ) : (
                                      <ul className="space-y-1.5 pl-1">
                                        {section.items.map((item, itemIdx) => (
                                          <li key={itemIdx} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                                            <span className={`${style.iconColor} text-[10px] mt-1 shrink-0`}>•</span>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleExpand(reflection.id)}
                            className="mt-4 flex items-center justify-center gap-1 w-full text-xs font-bold text-primary hover:text-primary/80 transition-colors py-2 border-t border-outline-variant/20"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                            </span>
                            {isExpanded ? "AI 회고 피드백 접기" : "AI 회고 피드백 펼치기"}
                          </button>
                        </article>
                      );
                    })}
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
