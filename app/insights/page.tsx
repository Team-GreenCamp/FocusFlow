"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { ReflectionSummary, RoadmapGoal } from "@/types/roadmap";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(value));
}

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
      
      // "회고" 성격의 문서 전체 제목(H1/H2 등)은 메인 레이아웃 타이틀로 가므로 개별 섹션에서는 제외합니다.
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
  // 개선할 점 / 아쉬운 점 / 기타
  return {
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-500/20 dark:border-amber-500/30",
    icon: "lightbulb",
    iconColor: "text-amber-500",
    accentLine: "bg-amber-500",
  };
}

export default function InsightsPage() {
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [reflections, setReflections] = useState<ReflectionSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadInsightData() {
      try {
        // 피드백 화면은 완료 업무와 회고 기록만 다루도록 캘린더 의존성을 분리합니다.
        const [goalsResponse, reflectionsResponse] = await Promise.all([
          fetch("/api/roadmaps"),
          fetch("/api/reflections"),
        ]);

        if (!goalsResponse.ok || !reflectionsResponse.ok) {
          throw new Error("피드백 데이터를 불러오지 못했습니다.");
        }

        const goalsData = (await goalsResponse.json()) as { goals: RoadmapGoal[] };
        const reflectionsData = (await reflectionsResponse.json()) as { reflections: ReflectionSummary[] };

        if (!ignore) {
          setGoals(goalsData.goals);
          setReflections(reflectionsData.reflections);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : "피드백 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInsightData();

    return () => {
      ignore = true;
    };
  }, []);

  const latestGoal = goals[0] ?? null;
  const completedSteps = useMemo(
    () => goals.flatMap((goal) => goal.steps.filter((step) => step.status === "DONE")),
    [goals],
  );
  const activeSteps = useMemo(
    () => goals.flatMap((goal) => goal.steps.filter((step) => step.status === "ACTIVE")),
    [goals],
  );
  const completionRate = latestGoal?.steps.length
    ? Math.round((latestGoal.steps.filter((step) => step.status === "DONE").length / latestGoal.steps.length) * 100)
    : 0;

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />


      <main className="pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-3xl mx-auto w-full min-h-screen">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-on-surface mb-1">
              작업 피드백
            </h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              실제 완료 기록과 회고를 바탕으로 다음 개선점을 확인합니다.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full text-primary font-bold text-sm">
            <span>완료 {completedSteps.length}개 · 회고 {reflections.length}개</span>
          </div>
        </header>

        {error ? <p className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="rounded-3xl border border-outline-variant/30 p-8 text-center text-on-surface-variant bg-surface-container">
            피드백 데이터를 불러오는 중입니다.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rate_review
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase font-semibold">
                    현재 업무 피드백
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
                  {latestGoal ? latestGoal.title : "아직 분석된 업무가 없습니다"}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed max-w-xl">
                  {latestGoal
                    ? `최근 업무는 ${completionRate}% 완료되었습니다. 진행 가능한 업무 ${activeSteps.length}개와 완료 업무 ${completedSteps.length}개를 기준으로 다음 회고를 작성하세요.`
                    : "먼저 업무 구체화 화면에서 추상적인 업무를 입력해 실행 단위를 만들어 주세요."}
                </p>
              </div>
              <div className="flex gap-3 z-10 mt-6">
                <Link
                  href="/breakdown"
                  className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
                >
                  업무 구체화로 이동
                </Link>
                <Link
                  href="/vault"
                  className="border border-outline-variant text-on-surface px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-surface-container-high active:scale-95"
                >
                  회고 보관소 보기
                </Link>
              </div>
            </div>

            <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-headline-md text-headline-md text-on-surface">최근 회고 피드백</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 px-3 py-1 rounded-full text-xs font-bold text-primary">
                    {formatDate(new Date().toISOString())}
                  </span>
                  <span className="bg-secondary/10 px-3 py-1 rounded-full text-xs font-bold text-secondary">
                    총 {reflections.length}개
                  </span>
                </div>
              </div>

              {reflections.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {reflections.map((ref) => {
                    const isExpanded = expandedId === ref.id;
                    return (
                      <div
                        key={ref.id}
                        onClick={() => setExpandedId(isExpanded ? null : ref.id)}
                        className={`block rounded-2xl bg-white/60 dark:bg-surface-container-low/40 p-5 border transition-all duration-300 group cursor-pointer ${
                          isExpanded
                            ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                            : "border-outline-variant/30 hover:border-primary/40 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <span className="text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
                            {ref.goalTitle ?? "일반 회고"}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-on-surface-variant font-medium">
                              {formatDate(ref.createdAt)}
                            </span>
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-300 group-hover:text-primary">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </div>
                        </div>
                        <p className="text-body-md text-on-surface leading-relaxed font-medium">
                          {ref.memo || "작성한 회고 메모가 없습니다."}
                        </p>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                              {parseMarkdown(ref.markdown).map((section, idx) => {
                                const style = getSectionStyle(section.title);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-4 transition-all duration-300`}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accentLine}`} />
                                    
                                    <div className="flex items-center gap-1.5 mb-2 pl-1">
                                      <span className={`material-symbols-outlined ${style.iconColor} text-[18px]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {style.icon}
                                      </span>
                                      <h5 className="font-bold text-on-surface text-sm">
                                        {section.title}
                                      </h5>
                                    </div>

                                    {section.items.length === 0 ? (
                                      <p className="text-xs text-on-surface-variant pl-6">기록된 항목이 없습니다.</p>
                                    ) : (
                                      <ul className="space-y-1.5 pl-1">
                                        {section.items.map((item, itemIdx) => (
                                          <li key={itemIdx} className="flex items-start gap-2 text-xs md:text-sm text-on-surface-variant leading-relaxed">
                                            <span className={`${style.iconColor} text-xs mt-0.5 shrink-0`}>•</span>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3.5 flex justify-between items-center">
                              <span className="text-[11px] text-on-surface-variant">
                                상세 리포트와 분석 결과가 포함되어 있습니다.
                              </span>
                              <Link
                                href={`/reflections/${ref.id}`}
                                className="inline-flex items-center gap-1 text-xs text-secondary font-bold hover:underline"
                              >
                                <span>상세 피드백 리포트 페이지로 이동</span>
                                <span className="material-symbols-outlined text-[14px]">
                                  open_in_new
                                </span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center text-sm text-on-surface-variant">
                  아직 생성된 회고 피드백이 없습니다. 업무를 완료한 뒤 회고 메모를 남겨 주세요.
                </div>
              )}
            </div>

            <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-5">다음 실행 후보</h4>
              <div className="space-y-4 relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
                {(activeSteps.length > 0 ? activeSteps.slice(0, 3) : completedSteps.slice(0, 3)).map((step, index) => (
                  <div key={step.id} className="relative pl-12 group">
                    <div className="absolute left-[13px] top-2 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-primary/20 group-hover:scale-125 transition-transform" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-secondary font-bold tracking-tighter uppercase">
                        {step.status === "ACTIVE" ? "진행 가능" : "완료됨"}
                      </span>
                      <h5 className="text-on-surface font-semibold group-hover:text-primary transition-colors text-sm">
                        {index + 1}. {step.title}
                      </h5>
                      <p className="text-xs text-on-surface-variant">{step.description}</p>
                    </div>
                  </div>
                ))}
                {activeSteps.length === 0 && completedSteps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center text-sm text-on-surface-variant">
                    표시할 업무가 없습니다.
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
