"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function statusLabel(status: RoadmapStep["status"]) {
  const labels = {
    ACTIVE: "진행 가능",
    DONE: "완료",
    LOCKED: "대기",
  };

  return labels[status];
}

export default function RoadmapDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const roadmapId = params.id;
  const [memo, setMemo] = useState("");
  const [goal, setGoal] = useState<RoadmapGoal | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [stepMemos, setStepMemos] = useState<Record<string, string>>({});
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

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
    let ignore = false;

    async function loadGoal() {
      setLoading("initial");
      try {
        const data = await callApi<{ goal: RoadmapGoal }>(`/api/roadmaps/${roadmapId}`);
        if (!ignore) {
          setGoal(data.goal);
          setGoalTitle(data.goal.title);
          setGoalDescription(data.goal.description ?? "");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : "업무 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!ignore) {
          setLoading("");
        }
      }
    }

    loadGoal();

    return () => {
      ignore = true;
    };
  }, [roadmapId]);

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

  async function deleteGoal() {
    if (!goal) return;
    if (!confirm(`"${goal.title}" 업무를 정말로 삭제하시겠습니까?\n이 목표에 포함된 모든 단계가 함께 영구 삭제됩니다.`)) {
      return;
    }

    setError("");
    setLoading("delete");

    try {
      await callApi(`/api/roadmaps/${goal.id}`, {
        method: "DELETE",
      });
      router.push("/");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 삭제에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function updateGoal() {
    if (!goal || !goalTitle.trim()) {
      setError("목표 제목을 입력해 주세요.");
      return;
    }

    setError("");
    setLoading("update-goal");

    try {
      // 목표 정보만 수정하며 현재 단계 진행 상태는 그대로 유지합니다.
      const data = await callApi<{ goal: RoadmapGoal }>(`/api/roadmaps/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: goalTitle.trim(),
          description: goalDescription.trim(),
        }),
      });
      setGoal(data.goal);
      setGoalTitle(data.goal.title);
      setGoalDescription(data.goal.description ?? "");
      setIsEditingGoal(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "목표 수정에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="bg-[#f2f4f6] dark:bg-[#121212] text-[#191f28] dark:text-[#f5f5f7] min-h-screen relative overflow-hidden">
      {/* Header */}
      <Header />



      {/* Main Content Canvas */}
      <main className="relative z-10 pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-5xl mx-auto w-full min-h-screen flex flex-col items-center">
        {/* 생성된 로드맵의 실행과 회고만 담당하는 상세 화면입니다. */}
        <section id="workspace" className="scroll-mt-24 w-full max-w-3xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <span className="text-primary font-bold font-label-md text-label-md tracking-widest uppercase font-semibold">구체화된 업무</span>
              <h2 className="font-headline-md text-headline-md mt-1 text-on-background">
                {goal?.title ?? "업무 실행 목록"}
              </h2>
              <p className="mt-2 text-on-surface-variant font-body-md text-body-md">
                생성된 업무를 확인하고, 진행 가능한 항목을 완료하거나 더 세분화합니다.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditingGoal((prev) => !prev)}
                className="rounded-lg border border-outline-variant bg-white/60 px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
              >
                {isEditingGoal ? "수정 취소" : "목표 수정"}
              </button>
              <Link
                href="/breakdown"
                className="rounded-lg border border-outline-variant bg-white/60 px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-container-low"
              >
                새 업무 구체화
              </Link>
              <button
                type="button"
                onClick={deleteGoal}
                disabled={loading === "delete"}
                className="rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-sm font-bold text-error/85 hover:text-error hover:bg-error/10 transition-all active:scale-95 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {loading === "delete" ? "삭제 중..." : "업무 삭제"}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error font-medium">
              {error}
            </p>
          )}

          {goal && isEditingGoal && (
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div>
                <label htmlFor="goal-title" className="mb-2 block text-sm font-bold text-on-surface">
                  목표 제목
                </label>
                <input
                  id="goal-title"
                  type="text"
                  value={goalTitle}
                  onChange={(event) => setGoalTitle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white/70 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="goal-description" className="mb-2 block text-sm font-bold text-on-surface">
                  목표 설명
                </label>
                <textarea
                  id="goal-description"
                  value={goalDescription}
                  onChange={(event) => setGoalDescription(event.target.value)}
                  className="min-h-28 w-full resize-none rounded-lg border border-outline-variant bg-white/70 p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="목표의 맥락, 제약 조건, 원하는 결과를 입력해 주세요."
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={updateGoal}
                  disabled={loading === "update-goal"}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50"
                >
                  {loading === "update-goal" ? "저장 중..." : "수정 저장"}
                </button>
              </div>
            </div>
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
          <div id="roadmap-list-section" className="scroll-mt-24 glass-card p-6 rounded-xl">
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
                    : "아직 구체화된 업무가 없습니다. 새 업무 구체화 화면에서 다시 생성해 주세요."}
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
                <strong>실행 가이드:</strong> [{currentStep.title}] 업무는 완료 여부를 판단할 수 있는 작은 결과를 남기는 것을 기준으로 진행하세요.
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
