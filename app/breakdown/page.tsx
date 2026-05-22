"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";

type Reflection = {
  id: string;
  markdown: string;
};

function isLeaf(step: RoadmapStep, steps: RoadmapStep[]) {
  return !steps.some((candidate) => candidate.parentStepId === step.id);
}

function findCurrentWorkStep(goal: RoadmapGoal | null) {
  if (!goal) {
    return null;
  }

  return goal.steps.find((step) => step.status === "ACTIVE" && isLeaf(step, goal.steps)) ?? null;
}

function minutesLabel(minutes: number) {
  return `${minutes}분`;
}

function statusLabel(status: RoadmapStep["status"]) {
  const labels = {
    ACTIVE: "진행 가능",
    DONE: "완료",
    LOCKED: "대기",
  };

  return labels[status];
}

export default function BreakdownPage() {
  const { status } = useSession();
  const router = useRouter();
  const [goalInput, setGoalInput] = useState("");
  const [memo, setMemo] = useState("");
  const [goal, setGoal] = useState<RoadmapGoal | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [stepMemos, setStepMemos] = useState<Record<string, string>>({});
  const [isFocused, setIsFocused] = useState(false);

  const placeholders = useMemo(() => [
    "예: 바디프로필 촬영을 위한 일주일 식단 구성 및 장보기",
    "예: 하프 마라톤 완주를 위한 단계별 달성 계획 설계",
    "예: 미니멀 라이프 실천을 위한 안 입는 옷 정리하기",
    "예: 월 2권 독서 달성을 위한 매일 30분 독서 루틴 짜기",
    "예: 주말 아침 러닝 및 스트레칭 습관 만들기",
    "예: 건강한 식생활을 위한 저염식 반찬 밀프렙 준비"
  ], []);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [placeholders]);

  const currentStep = useMemo(() => findCurrentWorkStep(goal), [goal]);
  const leafSteps = useMemo(() => goal?.steps.filter((step) => isLeaf(step, goal.steps)) ?? [], [goal]);
  const completedLeafSteps = useMemo(() => leafSteps.filter((step) => step.status === "DONE"), [leafSteps]);
  const rootSteps = useMemo(() => goal?.steps.filter((step) => !step.parentStepId) ?? [], [goal]);

  const progressPercent = useMemo(() => {
    if (leafSteps.length === 0) return 0;
    return Math.round((completedLeafSteps.length / leafSteps.length) * 100);
  }, [leafSteps, completedLeafSteps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !(prev[stepId] ?? (currentStep?.id === stepId)),
    }));
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading("");
      return;
    }

    let ignore = false;

    async function loadLatestGoal() {
      setLoading("initial");
      try {
        const selectedGoalId = new URLSearchParams(window.location.search).get("goalId");
        if (selectedGoalId) {
          const data = await callApi<{ goal: RoadmapGoal }>(`/api/roadmaps/${selectedGoalId}`);
          if (!ignore) {
            setGoal(data.goal);
          }
          return;
        }

        const data = await callApi<{ goals: RoadmapGoal[] }>("/api/roadmaps");
        if (!ignore) {
          setGoal(data.goals[0] ?? null);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : "최근 업무 분석을 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading("");
        }
      }
    }

    loadLatestGoal();

    return () => {
      ignore = true;
    };
  }, [status]);

  async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const rawText = await response.text();
    let data = { error: "빈 응답을 받았습니다." } as T & { error?: string };
    if (rawText) {
      try {
        data = JSON.parse(rawText) as T & { error?: string };
      } catch {
        data = { error: "서버가 JSON이 아닌 응답을 반환했습니다." } as T & { error?: string };
      }
    }
    if (!response.ok) {
      throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
    }
    return data;
  }

  async function createRoadmap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status !== "authenticated") {
      setError("업무를 저장하려면 Google 로그인이 필요합니다.");
      return;
    }

    setError("");
    setReflection(null);
    setLoading("roadmap");
    setExpandedSteps({});

    try {
      const data = await callApi<{ goal: RoadmapGoal }>("/api/roadmaps", {
        method: "POST",
        body: JSON.stringify({ goal: goalInput }),
      });
      setGoal(data.goal);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 구체화에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function completeStep(stepId: string) {
    setError("");
    setLoading(stepId);

    try {
      const memoValue = stepMemos[stepId] || "";
      const data = await callApi<{ goal: RoadmapGoal }>(`/api/steps/${stepId}/done`, {
        method: "PATCH",
        body: JSON.stringify({ memo: memoValue }),
      });
      setGoal(data.goal);
      setStepMemos((prev) => {
        const next = { ...prev };
        delete next[stepId];
        return next;
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "완료 처리에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function breakdownStep(stepId: string) {
    setError("");
    setLoading(`breakdown-${stepId}`);

    try {
      const data = await callApi<{ goal: RoadmapGoal }>(`/api/steps/${stepId}/breakdown`, { method: "POST" });
      setGoal(data.goal);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 추가 구체화에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function createReflection() {
    setError("");
    setLoading("reflection");

    try {
      const data = await callApi<{ reflection: Reflection }>("/api/reflections/daily", {
        method: "POST",
        body: JSON.stringify({ memo, goalId: goal?.id }),
      });
      setReflection(data.reflection);
      router.push(`/reflections/${data.reflection.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 피드백 생성에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

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
        {/* Workspace / App core */}
        <section id="workspace" className="scroll-mt-24 w-full max-w-3xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <span className="text-primary font-bold font-label-md text-label-md tracking-widest uppercase font-semibold">업무 목표 구체화</span>
              <h2 className="font-headline-md text-headline-md mt-1 text-on-background">막연한 업무를 실행 단위로 쪼개기</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
              <span className="font-label-sm text-label-sm text-on-background">회고 피드백 포함</span>
            </div>
          </div>

          <form onSubmit={createRoadmap} className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch shadow-md">
            <div className="relative flex-grow w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" aria-hidden="true">search</span>
              <input
                className="w-full pl-12 pr-4 h-12 bg-white/60 dark:bg-surface-container-high/60 backdrop-blur-sm border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-body-medium text-body-medium text-on-surface"
                type="text"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              {!goalInput && !isFocused && (
                <div
                  key={placeholderIndex}
                  className="absolute left-12 top-1/2 pointer-events-none font-body-medium text-body-medium text-outline/70 animate-placeholder-in truncate pr-4 max-w-[calc(100%-3.5rem)]"
                >
                  {placeholders[placeholderIndex]}
                </div>
              )}
            </div>
            <button
              disabled={loading === "roadmap"}
              className="w-full md:w-auto bg-primary text-white px-6 h-12 rounded-lg font-bold text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              type="submit"
            >
              {loading === "roadmap" ? "구체화 중..." : "업무 구체화"}
            </button>
          </form>

          {error && (
            <p className="rounded-md bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error font-medium">
              {error}
            </p>
          )}

          {/* Simplified Progress and Completed List Toggle */}
          {goal && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-on-surface">업무 실행 진행률</span>
                  <span className="text-sm font-bold text-primary">{progressPercent}% ({completedLeafSteps.length} / {leafSteps.length} 완료)</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {completedLeafSteps.length > 0 && (
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowCompletedToday(!showCompletedToday)}
                    className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <span className="text-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      완료한 구체 업무 ({completedLeafSteps.length}개)
                    </span>
                    <span className="material-symbols-outlined text-outline">
                      {showCompletedToday ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {showCompletedToday && (
                    <div className="p-4 pt-0 border-t border-outline-variant/30 space-y-2 bg-surface-container-lowest/50">
                      {completedLeafSteps.map((step) => (
                        <div key={step.id} className="flex flex-col gap-1 p-2.5 rounded bg-surface-container-low text-sm font-medium text-on-surface">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                            <span className="truncate">{step.title}</span>
                          </div>
                          {step.memo && (
                            <div className="ml-6 text-xs text-primary bg-primary/5 border border-primary/10 rounded px-2 py-0.5 max-w-max">
                              회고: {step.memo}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Flow Architecture Roadmap */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">구체화된 업무 목록</h3>
              </div>
            </div>

            {/* Timeline Wrapper */}
            <div className="relative space-y-8 before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
              {!goal || rootSteps.length === 0 ? (
                <div className="rounded-md border border-dashed border-outline-variant/30 p-8 text-center text-sm text-on-surface-variant bg-white/10 dark:bg-black/10">
                  {loading === "initial"
                    ? "최근 업무 분석을 불러오는 중입니다."
                    : "아직 구체화된 업무가 없습니다. 위 입력창에 막연한 업무를 적어 주세요."}
                </div>
              ) : (
                rootSteps.map((step, index) => {
                  const children = goal.steps.filter((child) => child.parentStepId === step.id) ?? [];
                  const isActive = currentStep?.id === step.id;
                  const hasActiveChild = children.some((child) => currentStep?.id === child.id);
                  const isCompleted = step.status === "DONE";
                  const isExpanded = expandedSteps[step.id] ?? (isActive || hasActiveChild);

                  return (
                    <div key={step.id} className={`relative pl-12 transition-opacity duration-300 ${!isActive && !isCompleted && !hasActiveChild ? "opacity-60" : ""}`}>
                      {/* Left Icon Badge */}
                      <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 border ${
                        isCompleted
                          ? "bg-primary text-white border-primary"
                          : isActive
                            ? "bg-secondary-container text-on-secondary-container border-secondary"
                            : "bg-white text-outline border-outline-variant"
                      }`}>
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-[20px]">check</span>
                        ) : isActive ? (
                          <span className="material-symbols-outlined text-[20px] animate-pulse">bolt</span>
                        ) : (
                          <span className="font-label-md text-label-md">{String(index + 1).padStart(2, '0')}</span>
                        )}
                      </div>

                      {/* Content Card */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start flex-wrap gap-2 cursor-pointer" onClick={() => toggleStep(step.id)}>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-headline-md text-headline-md ${isActive ? "text-primary font-bold" : "text-on-surface"}`}>
                              {step.title}
                            </h4>
                            {children.length > 0 && (
                              <span className="text-xs text-outline bg-surface-container px-2 py-0.5 rounded-full">
                                세부 업무 {children.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-on-surface-variant font-label-md text-label-md bg-surface-container px-3 py-1 rounded-full">
                              {minutesLabel(step.estimateMinutes)}
                            </span>
                            {children.length > 0 && (
                              <span className="material-symbols-outlined text-outline text-[20px]">
                                {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {step.description}
                        </p>
                        {step.memo && isCompleted && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/10 rounded-md px-2 py-1 max-w-max font-medium">
                            <span className="material-symbols-outlined text-[14px]">rate_review</span>
                            <span>간단 회고: {step.memo}</span>
                          </div>
                        )}

                        {/* 현재 실행 가능한 업무에만 액션 버튼 및 입력 폼을 표시합니다. */}
                        {isActive && (
                          <div className="flex flex-col gap-2.5 mt-2">
                            <div className="flex items-center gap-2 max-w-md w-full">
                              <span className="material-symbols-outlined text-sm text-primary">rate_review</span>
                              <input
                                type="text"
                                className="flex-1 text-xs bg-white/60 dark:bg-surface-container-high/60 backdrop-blur-sm border border-outline-variant/40 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                                placeholder="간단 회고 메모 적기 (선택사항)"
                                value={stepMemos[step.id] || ""}
                                onChange={(e) => setStepMemos(prev => ({ ...prev, [step.id]: e.target.value }))}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => completeStep(step.id)}
                                disabled={!!loading}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md shadow hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-50"
                              >
                                {loading === step.id ? "처리 중..." : "완료"}
                              </button>
                              <button
                                onClick={() => breakdownStep(step.id)}
                                disabled={!!loading}
                                className="px-4 py-2 bg-white border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50"
                              >
                                {loading === `breakdown-${step.id}` ? "구체화 중..." : "더 구체화"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Child steps (Accordion: only shown when expanded) */}
                        {children.length > 0 && isExpanded && (
                          <div className="mt-3 space-y-3 border-l-2 border-primary/20 pl-4 transition-all duration-300">
                            {children.map((child) => {
                              const isChildActive = currentStep?.id === child.id;
                              const isChildCompleted = child.status === "DONE";

                              return (
                                <div
                                  key={child.id}
                                  className={`rounded-lg p-3 border transition-colors ${
                                    isChildActive
                                      ? "bg-secondary-container/30 border-secondary/30"
                                      : isChildCompleted
                                        ? "bg-surface-container-low/50 border-outline-variant/30"
                                        : "bg-surface-container-lowest border-outline-variant/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className={`text-sm font-semibold ${isChildActive ? "text-primary font-bold" : "text-on-surface"}`}>
                                      {child.title}
                                    </p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                      isChildCompleted
                                        ? "bg-primary/10 text-primary"
                                        : isChildActive
                                          ? "bg-secondary-container text-on-secondary-container"
                                          : "bg-outline-variant/20 text-outline"
                                    }`}>
                                      {statusLabel(child.status)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm leading-5 text-on-surface-variant">
                                    {child.description}
                                  </p>
                                  {child.memo && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-primary bg-primary/5 border border-primary/10 rounded px-2 py-0.5 max-w-max font-medium">
                                      <span className="material-symbols-outlined text-[12px]">rate_review</span>
                                      <span>간단 회고: {child.memo}</span>
                                    </div>
                                  )}
                                  {isChildActive && (
                                    <div className="flex flex-col gap-2 mt-2">
                                      <div className="flex items-center gap-2 max-w-sm w-full">
                                        <span className="material-symbols-outlined text-xs text-primary">rate_review</span>
                                        <input
                                          type="text"
                                          className="flex-1 text-[11px] bg-white/60 dark:bg-surface-container-high/60 backdrop-blur-sm border border-outline-variant/40 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-on-surface"
                                          placeholder="간단 회고 메모 적기 (선택사항)"
                                          value={stepMemos[child.id] || ""}
                                          onChange={(e) => setStepMemos(prev => ({ ...prev, [child.id]: e.target.value }))}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => completeStep(child.id)}
                                          disabled={!!loading}
                                          className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
                                        >
                                          {loading === child.id ? "처리 중..." : "완료"}
                                        </button>
                                        <button
                                          onClick={() => breakdownStep(child.id)}
                                          disabled={!!loading}
                                          className="px-3 py-1 bg-white border border-outline-variant text-on-surface rounded text-xs font-semibold hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50"
                                        >
                                          {loading === `breakdown-${child.id}` ? "구체화 중..." : "더 구체화"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {goal && (
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">rate_review</span>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">업무 회고와 종료 피드백</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    완료한 구체 업무와 짧은 메모를 합쳐 다음 작업에 쓸 피드백으로 정리합니다.
                  </p>
                </div>
              </div>
              <textarea
                className="w-full min-h-28 resize-none rounded-lg border border-outline-variant bg-white/70 p-4 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="팁: 오늘 업무를 진행하며 느낀 점, 아쉬웠던 부분, 또는 다음에 다르게 시도해볼 행동 개선안을 자유롭게 남겨보세요."
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-on-surface-variant font-medium">
                  현재 피드백 재료: 완료 업무 {completedLeafSteps.length}개
                </p>
                <button
                  onClick={createReflection}
                  disabled={loading === "reflection" || !memo.trim()}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {loading === "reflection" ? "피드백 생성 중..." : "회고 피드백 생성"}
                </button>
              </div>
              {reflection && (
                <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-inverse-surface p-4 font-code text-code text-inverse-on-surface">
                  {reflection.markdown}
                </pre>
              )}
            </div>
          )}

          {/* Current Work Guide */}
          {currentStep && (
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-secondary flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary" aria-hidden="true">tips_and_updates</span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                <strong>실행 가이드:</strong> [{currentStep.title}] 업무는 약 {currentStep.estimateMinutes}분 안에 검토 가능한 결과를 남기는 것을 기준으로 진행하세요.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
