"use client";

import React from "react";
import Link from "next/link";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";

type ActiveGoalSectionProps = {
  goals: RoadmapGoal[];
  allGoalsLength: number;
  onOpenTaskSyncModal: (goalTitle: string, step: RoadmapStep) => void;
  onDeleteGoal: (goalId: string, goalTitle: string) => void;
  isLeaf: (step: RoadmapStep, steps: RoadmapStep[]) => boolean;
  findCurrentWorkStep: (goal: RoadmapGoal | null) => RoadmapStep | null;
};

export default function ActiveGoalSection({
  goals,
  allGoalsLength,
  onOpenTaskSyncModal,
  onDeleteGoal,
  isLeaf,
  findCurrentWorkStep,
}: ActiveGoalSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-headline-sm text-base font-bold text-[#191f28] flex items-center gap-1.5 pl-1">
        <span className="material-symbols-outlined text-[#3182f6] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        목표 몰입 할일 ({goals.length}개)
      </h3>

      <div className="glass-card p-5 rounded-3xl border border-[#edf1f5] shadow-sm min-h-[180px] flex flex-col justify-between">
        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-0.5">
          {allGoalsLength === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
              <span className="material-symbols-outlined text-[#8b95a1] text-3xl mb-2.5">task_alt</span>
              <p className="text-[#4e5968] text-xs break-keep leading-relaxed font-semibold">
                진행 중인 몰입 목표가 없습니다.
              </p>
            </div>
          ) : goals.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
              <span className="material-symbols-outlined text-[#8b95a1] text-3xl mb-2.5">calendar_today</span>
              <p className="text-[#4e5968] text-xs break-keep leading-relaxed max-w-[210px] font-semibold">
                선택하신 날짜에 연동된 몰입 목표 일정이 없습니다.
              </p>
            </div>
          ) : (
            goals.slice(0, 3).map((goal) => {
              const leafSteps = goal.steps.filter((s) => isLeaf(s, goal.steps));
              const completedLeaf = leafSteps.filter((s) => s.status === "DONE");
              const progress = leafSteps.length > 0 ? Math.round((completedLeaf.length / leafSteps.length) * 100) : 0;
              const activeStep = findCurrentWorkStep(goal);

              const isSynced = activeStep && activeStep.googleEventId;
              const isDone = activeStep && activeStep.status === "DONE";

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl bg-[#f9fafb] border border-[#edf1f5] hover:border-[#3182f6]/30 transition-all flex flex-col gap-3 relative overflow-hidden animate-fade-in"
                >
                  <div className="flex justify-between items-center gap-2 border-b border-[#edf1f5] pb-2">
                    <h4 className="font-bold text-sm text-[#191f28] truncate max-w-[60%]">
                      {goal.title}
                    </h4>
                    
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/roadmaps/${goal.id}#roadmap-list-section`}
                        className="text-[10px] text-[#8b95a1] font-bold flex items-center gap-0.5 hover:text-[#3182f6] hover:underline transition-colors"
                      >
                        상세
                        <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                      </Link>

                      <button
                        onClick={() => onDeleteGoal(goal.id, goal.title)}
                        className="text-[10px] text-[#8b95a1] font-bold flex items-center gap-0.5 hover:text-[#ff4b4b] hover:underline transition-colors"
                        title="이 업무 전체 삭제"
                        type="button"
                      >
                        삭제
                        <span className="material-symbols-outlined text-[12px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* 진행 바 - 토스 블루 색상 적용 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-[#8b95a1]">
                      <span>완료율</span>
                      <span className="text-[#3182f6]">{progress}% ({completedLeaf.length}/{leafSteps.length})</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#edf1f5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3182f6] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 액티브 다음 행동 및 달력 등록 */}
                  {activeStep && (
                    <div className="p-3 rounded-xl bg-white border border-[#edf1f5] flex items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[8.5px] text-[#3182f6] font-bold tracking-widest uppercase">
                          NEXT
                        </span>
                        <h5 className="font-bold text-xs text-[#191f28] truncate">
                          {activeStep.title}
                        </h5>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        
                        {/* 중복 연동 가드 UI */}
                        {isDone ? null : isSynced ? (
                          <div
                            title="구글 캘린더에 이미 연동된 몰입 업무입니다"
                            className="p-1 px-2.5 bg-[#e8f3ff] text-[#3182f6] rounded-lg text-[9.5px] font-bold flex items-center gap-0.5 select-none shrink-0"
                          >
                            <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            등록됨
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenTaskSyncModal(goal.title, activeStep)}
                            title="이 업무를 내 달력 일정에 추가하기"
                            className="p-1.5 bg-[#f2f4f6] border-none text-[#4e5968] hover:text-[#3182f6] hover:bg-[#e8f3ff] rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                          </button>
                        )}

                        <Link
                          href="/deep-work"
                          className="px-3 py-1.5 bg-[#3182f6] text-white font-bold rounded-xl text-[10px] shadow hover:bg-[#1b64da] hover:shadow-md transition-all flex items-center gap-0.5 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[11px] font-bold">bolt</span>
                          집중
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#edf1f5] pt-3.5 mt-4 flex justify-between items-center text-[10.5px] font-semibold text-[#8b95a1]">
          <span>전체 목표 총 {allGoalsLength}개 (선택일 연동 {goals.length}개)</span>
        </div>
      </div>
    </div>
  );
}
