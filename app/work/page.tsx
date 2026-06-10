"use client";

import Skeleton from "@/components/common/Skeleton";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";

type CalendarEventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
};

function isLeaf(step: RoadmapStep, steps: RoadmapStep[]) {
  return !steps.some((candidate) => candidate.parentStepId === step.id);
}

function formatEventTime(event: CalendarEventSummary) {
  if (!event.start) return "시간 없음";
  const start = new Date(event.start);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    ...(event.allDay ? {} : { hour: "2-digit", minute: "2-digit" }),
  }).format(start);
}

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function WorkPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);
  const [memoByStepId, setMemoByStepId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");

  async function loadWorkData() {
    setLoading(true);
    setError("");

    try {
      const [goalsResponse, calendarResponse] = await Promise.all([
        fetch("/api/roadmaps"),
        fetch("/api/calendar/events"),
      ]);
      const goalsData = (await goalsResponse.json()) as { goals?: RoadmapGoal[]; error?: string };
      const calendarData = (await calendarResponse.json()) as { events?: CalendarEventSummary[]; error?: string };

      if (!goalsResponse.ok) {
        throw new Error(goalsData.error ?? "업무 목록을 불러오지 못했습니다.");
      }

      setGoals(goalsData.goals ?? []);
      if (calendarResponse.ok) {
        setCalendarEvents(calendarData.events ?? []);
        setCalendarError("");
      } else {
        setCalendarEvents([]);
        setCalendarError(calendarData.error ?? "캘린더 일정을 불러오지 못했습니다.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "내 업무 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkData();
  }, []);

  const activeSteps = useMemo(
    () =>
      goals.flatMap((goal) =>
        goal.steps
          .filter((step) => step.status === "ACTIVE" && isLeaf(step, goal.steps))
          .map((step) => ({ goal, step })),
      ),
    [goals],
  );

  const completedToday = useMemo(
    () =>
      goals.flatMap((goal) =>
        goal.steps
          .filter((step) => step.status === "DONE" && isToday(step.completedAt))
          .map((step) => ({ goal, step })),
      ),
    [goals],
  );

  async function completeStep(step: RoadmapStep) {
    setWorkingId(step.id);
    setError("");

    try {
      const response = await fetch(`/api/steps/${step.id}/done`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: memoByStepId[step.id] ?? "" }),
      });
      const data = (await response.json()) as { goal?: RoadmapGoal; error?: string };

      if (!response.ok || !data.goal) {
        throw new Error(data.error ?? "업무 완료 처리에 실패했습니다.");
      }

      setMemoByStepId((prev) => ({ ...prev, [step.id]: "" }));
      await loadWorkData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 완료 처리에 실패했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function createRoadmapFromCalendar(event: CalendarEventSummary) {
    setWorkingId(event.id);
    setCalendarError("");

    const context = [
      event.start ? `시작: ${event.start}` : "",
      event.end ? `종료: ${event.end}` : "",
      event.location ? `장소: ${event.location}` : "",
      event.description ? `설명: ${event.description}` : "",
      "이 캘린더 일정을 실제 실행 가능한 준비/수행/마무리 업무로 구체화하세요.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/roadmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: event.title, context, source: "google-calendar", googleEventId: event.id }),
      });
      const data = (await response.json()) as { goal?: RoadmapGoal; error?: string };

      if (!response.ok || !data.goal) {
        throw new Error(data.error ?? "캘린더 일정을 업무로 구체화하지 못했습니다.");
      }

      router.push(`/roadmaps/${data.goal.id}`);
    } catch (requestError) {
      setCalendarError(requestError instanceof Error ? requestError.message : "캘린더 일정을 업무로 구체화하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteGoal(goalId: string, goalTitle: string) {
    if (!confirm(`"${goalTitle}" 업무를 정말로 삭제하시겠습니까?\n이 목표에 포함된 모든 단계가 함께 영구 삭제됩니다.`)) {
      return;
    }

    setWorkingId(goalId);
    setError("");

    try {
      const response = await fetch(`/api/roadmaps/${goalId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "업무 삭제에 실패했습니다.");
      }

      await loadWorkData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 삭제에 실패했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="bg-bg-primary text-text-primary min-h-screen">
      <Header />

      <main className="pt-24 px-margin-mobile md:px-gutter pb-24 max-w-5xl mx-auto w-full min-h-screen">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-primary font-bold font-label-md text-label-md tracking-widest uppercase">
              Work Overview
            </span>
            <h1 className="font-headline-lg text-headline-lg mt-1 text-text-primary">내 업무</h1>
            <p className="mt-2 text-text-primary-variant font-body-md text-body-md">
              진행 가능한 작업과 Google Calendar 일정을 한 화면에서 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={loadWorkData}
            className="rounded-xl bg-primary text-white px-5 py-2 text-sm font-bold shadow-sm hover:bg-primary/95 hover:scale-[1.01] active:scale-95 transition-all duration-200"
          >
            새로고침
          </button>
        </header>

        {error ? <p className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm text-error">{error}</p> : null}

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 space-y-4">
                <Skeleton className="h-8 w-36 mb-4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="glass-card rounded-3xl p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-text-primary">현재 진행 중인 작업</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {activeSteps.length}개
                </span>
              </div>

              {activeSteps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/30 p-8 text-center text-sm text-text-primary-variant">
                  진행 가능한 작업이 없습니다. 먼저 업무를 구체화해 주세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSteps.map(({ goal, step }) => (
                    <article key={step.id} className="rounded-2xl border border-outline-variant/30 dark:border-neutral-700/50 bg-surface-color/70 dark:bg-surface-color/40 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-primary">{goal.title}</p>
                          <h3 className="mt-1 font-bold text-text-primary dark:text-text-primary">{step.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-text-primary-variant dark:text-text-secondary">{step.description}</p>
                        </div>
                      </div>
                      <textarea
                        className="mt-4 min-h-20 w-full resize-none rounded-xl border border-border-color bg-surface-color dark:bg-surface-color/60 p-3 text-sm text-text-primary dark:text-text-primary outline-none focus:ring-2 focus:ring-primary"
                        placeholder="완료하면서 남길 짧은 메모"
                        value={memoByStepId[step.id] ?? ""}
                        onChange={(event) => setMemoByStepId((prev) => ({ ...prev, [step.id]: event.target.value }))}
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between w-full">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => completeStep(step)}
                            disabled={workingId === step.id}
                            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60"
                          >
                            {workingId === step.id ? "완료 중..." : "완료"}
                          </button>
                          <Link
                            href={`/roadmaps/${goal.id}`}
                            className="rounded-lg border border-border-color px-4 py-2 text-xs font-bold text-text-primary-variant dark:text-neutral-300 transition hover:bg-surface-container-low"
                          >
                            업무 상세 보기
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id, goal.title)}
                          disabled={workingId === goal.id}
                          className="text-xs font-semibold text-error/85 hover:text-error hover:underline transition-colors flex items-center gap-0.5"
                          title="이 업무(목표) 전체 삭제"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <section className="glass-card rounded-3xl p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-text-primary">캘린더 일정</h2>
                  <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                    7일 내 {calendarEvents.length}개
                  </span>
                </div>

                {calendarError ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm leading-6 text-text-primary-variant">
                    {calendarError}
                  </div>
                ) : calendarEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm text-text-primary-variant">
                    앞으로 7일 안에 표시할 일정이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calendarEvents.map((event) => {
                      const isAlreadyCreated = goals.some((goal) => goal.googleEventId === event.id);
                      return (
                        <article key={event.id} className="rounded-2xl border border-outline-variant/30 dark:border-neutral-700/50 bg-surface-color/70 dark:bg-surface-color/40 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold text-text-primary dark:text-text-primary">{event.title}</h3>
                              {event.location ? <p className="mt-1 text-xs text-text-primary-variant dark:text-text-secondary">{event.location}</p> : null}
                            </div>
                            <span className="shrink-0 text-xs font-bold text-primary">{formatEventTime(event)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            {isAlreadyCreated ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                <span>등록 완료</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => createRoadmapFromCalendar(event)}
                                disabled={workingId === event.id}
                                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-container hover:text-on-primary-container disabled:opacity-60"
                              >
                                {workingId === event.id ? "구체화 중..." : "이 일정 업무화"}
                              </button>
                            )}
                            {event.htmlLink ? (
                              <a
                                href={event.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-border-color px-3 py-2 text-xs font-bold text-text-primary-variant dark:text-neutral-300 transition hover:bg-surface-container-low"
                              >
                                캘린더 열기
                              </a>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="glass-card rounded-3xl p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md text-text-primary">오늘 완료한 업무</h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {completedToday.length}개
                  </span>
                </div>
                {completedToday.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm text-text-primary-variant">
                    오늘 완료한 업무가 아직 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completedToday.map(({ goal, step }) => (
                      <div key={step.id} className="rounded-xl bg-surface-color border border-border-color p-3">
                        <p className="text-xs font-bold text-primary">{goal.title}</p>
                        <p className="mt-1 text-sm font-semibold text-text-primary dark:text-text-primary">{step.title}</p>
                        {step.memo ? <p className="mt-1 text-xs text-text-primary-variant dark:text-text-secondary">{step.memo}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
