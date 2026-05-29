"use client";

import React from "react";
import Link from "next/link";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";

type ActiveGoalSectionProps = {
  goals: RoadmapGoal[];
  onOpenTaskSyncModal: (goalTitle: string, step: RoadmapStep) => void;
  onDeleteGoal: (goalId: string, goalTitle: string) => void;
  isLeaf: (step: RoadmapStep, steps: RoadmapStep[]) => boolean;
  findCurrentWorkStep: (goal: RoadmapGoal | null) => RoadmapStep | null;
};

export default function ActiveGoalSection({
  goals,
  onOpenTaskSyncModal,
  onDeleteGoal,
  isLeaf,
  findCurrentWorkStep,
}: ActiveGoalSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-1.5 pl-1">
        <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        목표 몰입 할일 ({goals.length}개)
      </h3>

      <div className="glass-card p-5 rounded-2xl min-h-[180px] flex flex-col justify-between border border-outline-variant/20 shadow-md">
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-0.5">
          {goals.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
              <span className="material-symbols-outlined text-outline/60 text-3xl mb-2">task_alt</span>
              <p className="text-on-surface-variant text-xs break-keep leading-relaxed">
                진행 중인 몰입 목표가 없습니다.
              </p>
            </div>
          ) : (
            goals.slice(0, 3).map((goal) => {
              const leafSteps = goal.steps.filter((s) => isLeaf(s, goal.steps));
              const completedLeaf = leafSteps.filter((s) => s.status === "DONE");
              const progress = leafSteps.length > 0 ? Math.round((completedLeaf.length / leafSteps.length) * 100) : 0;
              const activeStep = findCurrentWorkStep(goal);

              // 캘린더 동기화 및 완료 여부 파악
              const isSynced = activeStep && activeStep.googleEventId;
              const isDone = activeStep && activeStep.status === "DONE";

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-secondary/20 transition-all flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center gap-2 border-b border-outline-variant/15 pb-2">
                    <h4 className="font-bold text-sm text-on-surface truncate max-w-[50%]">
                      {goal.title}
                    </h4>
                    
                    <div className="flex items-center gap-3">
                      {/* 상세 링크 대상을 실제 /roadmaps/[id]#roadmap-list-section 으로 변경하여 극상의 스크롤 포커싱 UX 제공 */}
                      <Link
                        href={`/roadmaps/${goal.id}#roadmap-list-section`}
                        className="text-[10px] text-outline font-bold flex items-center gap-0.5 hover:text-primary hover:underline transition-colors"
                      >
                        상세
                        <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                      </Link>

                      <button
                        onClick={() => onDeleteGoal(goal.id, goal.title)}
                        className="text-[10px] text-outline font-bold flex items-center gap-0.5 hover:text-error hover:underline transition-colors animate-fade-in"
                        title="이 업무 전체 삭제"
                        type="button"
                      >
                        삭제
                        <span className="material-symbols-outlined text-[11px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* 진행 바 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-outline">
                      <span>완료율</span>
                      <span className="text-secondary">{progress}% ({completedLeaf.length}/{leafSteps.length})</span>
                    </div>
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 액티브 다음 행동 및 달력 중복 가드 등록 제어 */}
                  {activeStep && (
                    <div className="p-2.5 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[8.5px] text-primary font-bold tracking-widest uppercase">
                          NEXT
                        </span>
                        <h5 className="font-semibold text-xs text-on-surface truncate">
                          {activeStep.title}
                        </h5>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        
                        {/* 중복 연동 가드 UI 제어 */}
                        {isDone ? (
                          // 1. 이미 완료된 업무면 달력 추가 아이콘 노출 자체를 원천 차단
                          null
                        ) : isSynced ? (
                          // 2. 이미 달력에 동기화가 성공했다면, 초록색 등록 완료 배지 및 클릭 차단
                          <div
                            title="구글 캘린더에 이미 연동된 몰입 업무입니다"
                            className="p-1 px-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded text-[9.5px] font-bold flex items-center gap-0.5 select-none shrink-0"
                          >
                            <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            등록됨
                          </div>
                        ) : (
                          // 3. 아직 동기화 전이고 완료 안 된 활성 상태일 때만 정상적으로 등록 단축키 노출
                          <button
                            onClick={() => onOpenTaskSyncModal(goal.title, activeStep)}
                            title="이 업무를 내 달력 일정에 추가하기"
                            className="p-1.5 bg-surface-container border border-outline-variant text-on-surface-variant hover:text-secondary rounded transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                          </button>
                        )}

                        <Link
                          href="/deep-work"
                          className="px-2.5 py-1.5 bg-primary text-white font-bold rounded text-[10px] shadow hover:bg-primary/95 transition-all flex items-center gap-0.5 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[10px]">bolt</span>
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

        <div className="border-t border-outline-variant/15 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
          <span className="text-outline font-medium">진행 중인 목표 총 {goals.length}개</span>
        </div>
      </div>
    </div>
  );
}
