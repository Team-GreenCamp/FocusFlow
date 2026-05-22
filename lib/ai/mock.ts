import type { BreakdownOutput, RoadmapOutput } from "@/types/roadmap";

export function mockRoadmap(goal: string): RoadmapOutput {
  return {
    steps: [
      {
        title: "업무 의도 정리",
        description: `"${goal}"을 왜 해야 하는지, 최종 산출물이 무엇인지 한 문단으로 정리합니다.`,
        estimateMinutes: 25,
      },
      {
        title: "입력 자료와 제약 확인",
        description: "필요한 자료, 기존 파일, 일정, 품질 기준을 한곳에 모읍니다.",
        estimateMinutes: 35,
      },
      {
        title: "구체 작업 단위 분리",
        description: "추상적인 업무를 검증 가능한 작은 작업 단위로 나누고 수행 순서를 정합니다.",
        estimateMinutes: 30,
      },
      {
        title: "첫 번째 산출물 제작",
        description: "작게 검증 가능한 초안을 만들고 부족한 부분을 기록합니다.",
        estimateMinutes: 50,
      },
      {
        title: "결과 검토와 피드백 정리",
        description: "완료 조건과 결과물을 비교하고 다음 작업에 반영할 피드백을 정리합니다.",
        estimateMinutes: 30,
      },
    ],
  };
}

export function mockBreakdown(title: string): BreakdownOutput {
  return {
    steps: [
      {
        title: "현재 업무 상태 적기",
        description: `"${title}"을 진행하기 전에 이미 정해진 것과 아직 애매한 것을 구분합니다.`,
        estimateMinutes: 5,
      },
      {
        title: "가장 작은 작업 정의",
        description: "바로 실행하고 완료 여부를 판단할 수 있는 한 줄 작업으로 바꿉니다.",
        estimateMinutes: 10,
      },
      {
        title: "작은 산출물 만들기",
        description: "완벽한 결과보다 검토 가능한 작은 산출물을 먼저 만듭니다.",
        estimateMinutes: 10,
      },
      {
        title: "피드백 메모 남기기",
        description: "결과를 보고 다음에 고칠 점이나 이어갈 일을 한 줄로 남깁니다.",
        estimateMinutes: 5,
      },
    ],
  };
}
