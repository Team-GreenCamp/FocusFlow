import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { mockBreakdown, mockRoadmap } from "@/lib/ai/mock";
import { reflectionResponseSchema, roadmapResponseSchema } from "@/lib/ai/schemas";
import {
  breakdownOutputSchema,
  reflectionOutputSchema,
  roadmapOutputSchema,
  type BreakdownOutput,
  type RoadmapOutput,
} from "@/types/roadmap";

const model = process.env.VERTEX_MODEL ?? "gemini-2.5-flash";

export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiResponseError";
  }
}

function shouldUseMock() {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI?.toLowerCase() === "true";

  return (
    process.env.AI_MOCK_MODE === "true" ||
    !process.env.GOOGLE_CLOUD_PROJECT ||
    !useVertex
  );
}

function vertexClient() {
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  });
}

async function generateStructured<T>(
  contents: string,
  responseSchema: object,
  schema: z.ZodType<T>,
) {
  const response = await vertexClient().models.generateContent({
    model,
    contents,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Vertex AI 응답이 비어 있습니다.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new AiResponseError("Vertex AI가 JSON 형식이 아닌 응답을 반환했습니다.");
  }

  // Gemini 구조화 출력도 DB 저장 전 앱 레벨에서 한 번 더 검증합니다.
  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    const issueText = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join(", ");
    console.error("Vertex AI schema validation failed", { rawText, issues: parsed.error.issues });
    throw new AiResponseError(`Vertex AI 응답 형식이 앱 스키마와 맞지 않습니다. ${issueText}`);
  }

  return parsed.data;
}

export async function generateRoadmap(goal: string, context?: string): Promise<RoadmapOutput> {
  if (shouldUseMock()) {
    return mockRoadmap(goal);
  }

  return generateStructured(
    [
      "당신은 추상적인 업무를 구체적인 실행 단위로 바꾸는 업무 분석 코치입니다.",
      "상위 업무를 완료 조건이 분명한 실행 단계로 나누고 논리적 의존 순서대로 정렬하세요.",
      "각 단계는 제목과 구체적 설명만 포함해야 하며, 시간 추정이나 분 단위 표현은 작성하지 마세요.",
      "너무 크고 무거운 단계가 필요해 보인다면 완료 여부를 판단할 수 있는 더 작은 실행 단계로 나누어 제안하세요.",
      `상위 업무: ${goal}`,
      context ? `업무 맥락: ${context}` : "",
    ].join("\n"),
    roadmapResponseSchema,
    roadmapOutputSchema,
  );
}

export async function generateBreakdown(input: {
  goalTitle: string;
  stepTitle: string;
  stepDescription: string;
}): Promise<BreakdownOutput> {
  if (shouldUseMock()) {
    return mockBreakdown(input.stepTitle);
  }

  return generateStructured(
    [
      "아래 업무 단계를 더 구체적인 실행 지침으로 다시 나누세요.",
      "각 하위 단계는 제목과 구체적 설명만 포함해야 하며, 시간 추정이나 분 단위 표현은 작성하지 마세요.",
      "기존 업무 맥락을 유지하고, 완료 여부를 판단할 수 있는 행동만 작성하세요.",
      `상위 업무: ${input.goalTitle}`,
      `현재 단계: ${input.stepTitle}`,
      `현재 단계 설명: ${input.stepDescription}`,
    ].join("\n"),
    roadmapResponseSchema,
    breakdownOutputSchema,
  );
}

export async function generateDailyReflection(input: {
  memo: string;
  completedStepTitles: string[];
}) {
  if (shouldUseMock()) {
    return {
      markdown: [
        "# 오늘의 뚜잇 회고",
        "",
        "## 완료한 일",
        ...input.completedStepTitles.map((title) => `- ${title}`),
        "",
        "## 한 줄 메모",
        input.memo,
        "",
        "## 내일 이어갈 방향",
        "- 오늘 완료한 흐름을 기준으로 가장 작은 다음 행동부터 시작합니다.",
      ].join("\n"),
    };
  }

  return generateStructured(
    [
      "완료된 업무 목록과 사용자의 한 줄 메모를 바탕으로 한국어 업무 회고와 피드백 Markdown을 작성하세요.",
      "섹션은 완료한 업무, 잘된 점, 개선할 점, 다음 업무에 반영할 피드백으로 구성하세요.",
      `완료 태스크: ${input.completedStepTitles.join(", ") || "없음"}`,
      `사용자 메모: ${input.memo}`,
    ].join("\n"),
    reflectionResponseSchema,
    reflectionOutputSchema,
  );
}
