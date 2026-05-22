import { Type } from "@google/genai";

const stepSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "실행자가 바로 이해할 수 있는 짧은 단계 제목",
    },
    description: {
      type: Type.STRING,
      description: "이 단계를 완료하기 위해 해야 하는 구체적인 행동 설명",
    },
    estimateMinutes: {
      type: Type.INTEGER,
      description: "예상 소요 시간. 분 단위 정수",
    },
  },
  required: ["title", "description", "estimateMinutes"],
};

export const roadmapResponseSchema = {
  type: Type.OBJECT,
  properties: {
    steps: {
      type: Type.ARRAY,
      description: "논리적 의존 순서대로 정렬된 하위 태스크",
      items: stepSchema,
    },
  },
  required: ["steps"],
};

export const reflectionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    markdown: {
      type: Type.STRING,
      description: "오늘의 완료 내역과 메모를 정리한 한국어 Markdown 회고",
    },
  },
  required: ["markdown"],
};
