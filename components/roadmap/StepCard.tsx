import React from 'react';
import type { RoadmapStep } from "@/types/roadmap";

interface StepCardProps {
  step: RoadmapStep;
  index: number;
  isActive: boolean;
  hasActiveChild: boolean;
  isCompleted: boolean;
  isExpanded: boolean;
  toggleStep: (stepId: string) => void;
  subSteps: RoadmapStep[];
  currentStepId: string | undefined;
  loading: string;
  stepMemos: Record<string, string>;
  setStepMemos: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  completeStep: (stepId: string) => void;
  breakdownStep: (stepId: string) => void;
  statusLabel: (status: RoadmapStep["status"]) => string;
}

export default function StepCard({
  step,
  index,
  isActive,
  hasActiveChild,
  isCompleted,
  isExpanded,
  toggleStep,
  subSteps: children,
  currentStepId,
  loading,
  stepMemos,
  setStepMemos,
  completeStep,
  breakdownStep,
  statusLabel,
}: StepCardProps) {
  return (
    <div className={`relative pl-12 transition-all duration-200 ease-in-out ${!isActive && !isCompleted && !hasActiveChild ? "opacity-60" : ""}`}>
      {/* Left Icon Badge */}
      <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 border transition-all duration-200 ${
        isCompleted
          ? "bg-primary text-white border-primary shadow-sm"
          : isActive
            ? "bg-secondary-container text-on-secondary-container border-secondary shadow-md scale-105"
            : "bg-surface-color text-outline border-border-color"
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
      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-surface-color/50 dark:bg-surface-color/20 border border-border-color hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
        <div className="flex justify-between items-start flex-wrap gap-2 cursor-pointer" onClick={() => toggleStep(step.id)}>
          <div className="flex items-center gap-2">
            <h4 className={`font-headline-md text-headline-md transition-colors ${isActive ? "text-primary font-bold" : "text-text-primary"}`}>
              {step.title}
            </h4>
            {children.length > 0 && (
              <span className="text-xs text-text-secondary bg-border-color px-2 py-0.5 rounded-full">
                세부 업무 {children.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {children.length > 0 && (
              <span className="material-symbols-outlined text-text-secondary text-[20px] transition-transform duration-200">
                {isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            )}
          </div>
        </div>
        <p className="font-body-md text-body-md text-text-secondary">
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
                className="flex-1 text-xs bg-surface-color backdrop-blur-sm border border-border-color rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-text-primary transition-all duration-200"
                placeholder="간단 회고 메모 적기 (선택사항)"
                value={stepMemos[step.id] || ""}
                onChange={(e) => setStepMemos(prev => ({ ...prev, [step.id]: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => completeStep(step.id)}
                disabled={!!loading}
                className="px-4 py-2 bg-primary text-white rounded-lg font-label-md text-label-md shadow hover:bg-primary/90 transition-all active:scale-95 duration-200 disabled:opacity-50"
              >
                {loading === step.id ? "처리 중..." : "완료"}
              </button>
              <button
                onClick={() => breakdownStep(step.id)}
                disabled={!!loading}
                className="px-4 py-2 bg-surface-color border border-border-color text-text-primary rounded-lg font-label-md text-label-md hover:bg-border-color/50 transition-all active:scale-95 duration-200 disabled:opacity-50"
              >
                {loading === `breakdown-${step.id}` ? "구체화 중..." : "더 구체화"}
              </button>
            </div>
          </div>
        )}

        {/* Child steps (Accordion: only shown when expanded) */}
        {children.length > 0 && isExpanded && (
          <div className="mt-3 space-y-3 border-l-2 border-primary/20 pl-4 transition-all duration-200">
            {children.map((child) => {
              const isChildActive = currentStepId === child.id;
              const isChildCompleted = child.status === "DONE";

              return (
                <div
                  key={child.id}
                  className={`rounded-lg p-3 border transition-all duration-200 hover:shadow-sm ${
                    isChildActive
                      ? "bg-secondary-container/30 border-secondary/30"
                      : isChildCompleted
                        ? "bg-border-color/20 border-border-color"
                        : "bg-surface-color border-border-color"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold transition-colors ${isChildActive ? "text-primary font-bold" : "text-text-primary"}`}>
                      {child.title}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded transition-all duration-200 ${
                      isChildCompleted
                        ? "bg-primary/10 text-primary"
                        : isChildActive
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-border-color text-text-secondary"
                    }`}>
                      {statusLabel(child.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-text-secondary">
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
                          className="flex-1 text-[11px] bg-surface-color backdrop-blur-sm border border-border-color rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-text-primary transition-all duration-200"
                          placeholder="간단 회고 메모 적기 (선택사항)"
                          value={stepMemos[child.id] || ""}
                          onChange={(e) => setStepMemos(prev => ({ ...prev, [child.id]: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => completeStep(child.id)}
                          disabled={!!loading}
                          className="px-3 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90 transition-all active:scale-95 duration-200 disabled:opacity-50"
                        >
                          {loading === child.id ? "처리 중..." : "완료"}
                        </button>
                        <button
                          onClick={() => breakdownStep(child.id)}
                          disabled={!!loading}
                          className="px-3 py-1 bg-surface-color border border-border-color text-text-primary rounded text-xs font-semibold hover:bg-border-color/50 transition-all active:scale-95 duration-200 disabled:opacity-50"
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
}
