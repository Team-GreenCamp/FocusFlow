import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { generateRoadmap } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";

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

    const body = (await request.json()) as { goal?: string };
    const goalTitle = body.goal?.trim();

    if (!goalTitle) {
      return NextResponse.json({ error: "구체화할 업무를 입력해 주세요." }, { status: 400 });
    }

    const roadmap = await generateRoadmap(goalTitle);

    // 검증된 AI 결과만 트랜잭션으로 저장합니다.
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: goalTitle,
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
