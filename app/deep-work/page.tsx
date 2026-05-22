"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";

function isLeaf(step: RoadmapStep, steps: RoadmapStep[]) {
  return !steps.some((candidate) => candidate.parentStepId === step.id);
}

function findCurrentStep(goal: RoadmapGoal | null) {
  if (!goal) {
    return null;
  }

  return goal.steps.find((step) => step.status === "ACTIVE" && isLeaf(step, goal.steps)) ?? null;
}

export default function DeepWorkPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(2);
  const [goal, setGoal] = useState<RoadmapGoal | null>(null);
  const [error, setError] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");
  const [stepMemo, setStepMemo] = useState("");
  const totalSessions = 5;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStep = findCurrentStep(goal);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    let ignore = false;

    async function loadCurrentWork() {
      try {
        const response = await fetch("/api/roadmaps");
        const data = (await response.json()) as { goals: RoadmapGoal[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "현재 업무를 불러오지 못했습니다.");
        }

        if (!ignore) {
          setGoal(data.goals[0] ?? null);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError instanceof Error ? requestError.message : "현재 업무를 불러오지 못했습니다.");
        }
      }
    }

    loadCurrentWork();

    return () => {
      ignore = true;
    };
  }, []);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    if (sessionCount < totalSessions) {
      setSessionCount((prev) => prev + 1);
    }
    setTimeLeft(25 * 60);

    if (!currentStep) {
      setCompleteMessage("완료 처리할 현재 업무가 없습니다. 먼저 업무를 구체화해 주세요.");
      return;
    }

    try {
      // 기록 완료는 실제 업무 단계 완료 API와 동기화합니다.
      const response = await fetch(`/api/steps/${currentStep.id}/done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memo: stepMemo }),
      });
      const data = (await response.json()) as { goal: RoadmapGoal; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "업무 완료 처리에 실패했습니다.");
      }

      setGoal(data.goal);
      setCompleteMessage("업무 기록을 완료했습니다. 회고 메모를 남겨 보세요.");
      setStepMemo("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "업무 완료 처리에 실패했습니다.");
    }
  };

  const handleBreak = () => {
    setIsRunning(false);
    setTimeLeft(5 * 60); // 5 mins break
    setIsRunning(true);
  };

  const handleExtend = () => {
    setTimeLeft((prev) => prev + 5 * 60); // Add 5 minutes
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG Circle Progress calculation
  // Radius is 48%, Circumference is 2 * PI * r
  // We can just calculate percentage and use stroke-dashoffset or stroke-dasharray
  const percentage = (timeLeft / (25 * 60)) * 100;

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Header */}
      <Header />



      {/* Main Content Canvas */}
      <main className="pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-container-max mx-auto w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Ambient Element */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[160px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
          {/* Sprint Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-label-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              진행 중인 업무 기록
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
              {currentStep ? currentStep.title : "진행 가능한 업무가 없습니다"}
            </h1>
            <p className="text-on-surface-variant font-body-lg">
              {currentStep
                ? currentStep.description
                : "업무 구체화 화면에서 막연한 업무를 먼저 실행 단위로 바꿔 주세요."}
            </p>
          </div>

          {error ? <p className="mb-6 rounded-md bg-error-container px-4 py-3 text-sm text-error">{error}</p> : null}
          {completeMessage ? (
            <p className="mb-6 rounded-md bg-secondary-container px-4 py-3 text-sm font-semibold text-on-secondary-container">
              {completeMessage}
            </p>
          ) : null}

          {/* Central Timer */}
          <div className="relative mb-16 select-none cursor-pointer flex items-center justify-center w-80 h-80 rounded-full bg-surface-container/20 shadow-inner" onClick={handleStartPause}>
            {/* Circular Progress SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-0">
              <circle
                className="text-surface-container-high"
                cx="50%"
                cy="50%"
                fill="transparent"
                r="45%"
                stroke="currentColor"
                strokeWidth="2"
              ></circle>
              <circle
                className="text-primary transition-all duration-1000"
                cx="50%"
                cy="50%"
                fill="transparent"
                r="45%"
                stroke="currentColor"
                strokeDasharray="282.7" // Circumference for r=45% of 100 is ~282.7
                strokeDashoffset={282.7 - (282.7 * percentage) / 100}
                strokeLinecap="round"
                strokeWidth="6"
              ></circle>
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="font-headline-lg text-[64px] md:text-[80px] leading-none font-bold tracking-tighter text-on-surface timer-glow">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-semibold text-primary/80 mt-2 uppercase tracking-widest">
                {isRunning ? "클릭하여 일시정지" : "클릭하여 시작"}
              </span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="w-full max-w-md mb-16">
            <div className="flex justify-between items-end mb-3">
              <span className="text-label-md text-on-surface-variant">
                전체 업무의 {Math.round((sessionCount / totalSessions) * 100)}% 기록
              </span>
              <span className="text-label-md font-bold text-primary">
                {sessionCount.toString().padStart(2, "0")} / {totalSessions.toString().padStart(2, "0")} 세션
              </span>
            </div>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(0,65,200,0.3)] transition-all duration-700"
                style={{ width: `${(sessionCount / totalSessions) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 간단 회고 메모 입력창 (선택사항) */}
          {currentStep && (
            <div className="w-full max-w-md mb-8 flex items-center gap-3 bg-white/40 dark:bg-surface-container-high/40 backdrop-blur-md px-4 py-2.5 rounded-xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-primary text-lg">rate_review</span>
              <input
                type="text"
                placeholder="완료 시 함께 기록할 간단 회고 메모 (선택사항)"
                value={stepMemo}
                onChange={(e) => setStepMemo(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder-on-surface-variant/80 w-full outline-none"
              />
            </div>
          )}

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleComplete}
              className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span>완료</span>
            </button>
            <button
              onClick={handleBreak}
              className="flex items-center gap-3 px-8 py-4 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">coffee</span>
              <span>휴식하기</span>
            </button>
            <button
              onClick={handleExtend}
              className="flex items-center gap-3 px-8 py-4 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">more_time</span>
              <span>5분 연장</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-3 px-6 py-4 bg-surface-container-lowest border border-outline-variant text-error rounded-xl font-semibold hover:bg-error-container/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">replay</span>
              <span>초기화</span>
            </button>
          </div>
        </div>



        {/* 업무 기록 화면의 배경 장식입니다. */}
        <div className="fixed bottom-16 left-0 w-64 h-64 -translate-x-12 translate-y-12 opacity-10 pointer-events-none z-0">
          <img
            className="w-full h-full object-contain"
            alt="Atmospheric background design with structural lines"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAI4S2_aZ1z3sKChxvz4F42wFwsuiVrkH10mHz3Lyswn0yemZqUH5he609aQd7ClSDgaF6yoxMbwlVJn1jSIMDSzxaggEgO1SDDaAsMk7E4yzydKwMZ61iEZQwKDRaZLsLtYnIfBN0mBjwZd6jJl2OGsfHe7ER8ThP_8VLyN_ndDz9SgfVl5YS33kKn_0woWcGT9lh0ItfHoq55JYLXEtNNSK0-IfigsAWTXIIDGa-KKsolEJ162Aq2LBIGi_tFlOiEjg8zx5aB-xHC"
          />
        </div>
      </main>

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
