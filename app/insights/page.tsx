"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import type { ReflectionSummary, RoadmapGoal } from "@/types/roadmap";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(value));
}

function formatEventTime(event: CalendarEventSummary) {
  if (!event.start) {
    return "시간 없음";
  }

  const start = new Date(event.start);
  if (event.allDay) {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "short",
      day: "numeric",
    }).format(start);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
}

export default function InsightsPage() {
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [reflections, setReflections] = useState<ReflectionSummary[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);
  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadInsightData() {
      try {
        const [goalsResponse, reflectionsResponse, calendarResponse] = await Promise.all([
          fetch("/api/roadmaps"),
          fetch("/api/reflections"),
          fetch("/api/calendar/events"),
        ]);

        if (!goalsResponse.ok || !reflectionsResponse.ok) {
          throw new Error("피드백 데이터를 불러오지 못했습니다.");
        }

        const goalsData = (await goalsResponse.json()) as { goals: RoadmapGoal[] };
        const reflectionsData = (await reflectionsResponse.json()) as { reflections: ReflectionSummary[] };
        const calendarData = (await calendarResponse.json()) as { events?: CalendarEventSummary[]; error?: string };

        if (!ignore) {
          setGoals(goalsData.goals);
          setReflections(reflectionsData.reflections);
          if (calendarResponse.ok) {
            setCalendarEvents(calendarData.events ?? []);
            setCalendarError("");
          } else {
            setCalendarEvents([]);
            setCalendarError(calendarData.error ?? "Google Calendar 일정을 불러오지 못했습니다.");
          }
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
  const latestReflection = reflections[0] ?? null;
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

  const reconnectCalendar = () => {
    signIn(
      "google",
      { callbackUrl: "/insights" },
      {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
        scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
      },
    );
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />
      <Sidebar />

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
                  href="/"
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
                <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-semibold text-on-surface">
                  {latestReflection ? formatDate(latestReflection.createdAt) : "기록 없음"}
                </span>
              </div>

              {latestReflection ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline-variant/30">
                    <p className="text-xs text-primary font-bold mb-2">
                      {latestReflection.goalTitle ?? "독립 회고"}
                    </p>
                    <p className="text-sm text-on-surface-variant leading-6">{latestReflection.memo}</p>
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-inverse-surface p-4 font-code text-code text-inverse-on-surface">
                    {latestReflection.markdown}
                  </pre>
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
                        {step.status === "ACTIVE" ? "진행 가능" : "완료됨"} · {step.estimateMinutes}분
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

            <div className="bg-surface-container rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h4 className="font-headline-md text-headline-md text-on-surface">다가오는 캘린더 일정</h4>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  7일 내 {calendarEvents.length}개
                </span>
              </div>

              {calendarError ? (
                <div className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm leading-6 text-on-surface-variant">
                  {calendarError}
                  <br />
                  캘린더 권한을 새로 승인하려면 로그아웃 후 Google 로그인을 다시 진행해 주세요.
                  <button
                    type="button"
                    onClick={reconnectCalendar}
                    className="mt-4 block rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-container hover:text-on-primary-container"
                  >
                    Google Calendar 권한 다시 승인
                  </button>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/30 p-5 text-sm text-on-surface-variant">
                  앞으로 7일 안에 표시할 일정이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.map((event) => (
                    <a
                      key={event.id}
                      href={event.htmlLink ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl bg-surface-container-lowest p-4 border border-outline-variant/30 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-on-surface">{event.title}</p>
                          {event.location ? (
                            <p className="mt-1 text-xs text-on-surface-variant">{event.location}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-xs font-bold text-primary">{formatEventTime(event)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
