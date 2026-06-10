import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";

// 리프 노드인지 확인하는 헬퍼 함수
export function isLeaf(step: RoadmapStep, steps: RoadmapStep[]): boolean {
  return !steps.some((candidate) => candidate.parentStepId === step.id);
}

// 현재 수행해야 하는 ACTIVE 상태 단계 찾기
export function findCurrentWorkStep(goal: RoadmapGoal | null): RoadmapStep | null {
  if (!goal) return null;
  return goal.steps.find((step) => step.status === "ACTIVE" && isLeaf(step, goal.steps)) ?? null;
}
