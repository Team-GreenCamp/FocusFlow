import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { generateRoadmap } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";
import { z } from "zod";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { steps: true },
  });

  return NextResponse.json({ goals: goals.map(serializeGoal) });
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "올바르지 않은 JSON 요청 형식입니다." }, { status: 400 });
    }

    const roadmapSchema = z.object({
      goal: z.string({ required_error: "구체화할 업무를 입력해 주세요." }).trim().min(1, "구체화할 업무를 입력해 주세요."),
      context: z.string().trim().optional(),
      source: z.string().optional(),
      googleEventId: z.string().trim().optional(),
    });

    const validation = roadmapSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || "요청 데이터가 유효하지 않습니다.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { goal: goalTitle, context: goalContext, googleEventId } = validation.data;

    const roadmap = await generateRoadmap(goalTitle, goalContext);

    // 검증된 AI 결과만 트랜잭션으로 저장합니다.
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: goalTitle,
        description: goalContext || null,
        googleEventId: googleEventId || null,
        steps: {
          create: roadmap.steps.map((step, index) => ({
            title: step.title,
            description: step.description,
            estimateMinutes: step.estimateMinutes,
            order: index,
            status: index === 0 ? TaskStatus.ACTIVE : TaskStatus.LOCKED,
          })),
        },
      },
      include: { steps: true },
    });

    return NextResponse.json({ goal: serializeGoal(goal) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "업무를 구체화하지 못했습니다. AI 응답 또는 DB 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
}
