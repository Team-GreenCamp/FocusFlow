import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { AiResponseError, generateBreakdown } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;
    const step = await prisma.taskStep.findUnique({
      where: { id },
      include: { goal: true, childSteps: true },
    });

    if (!step || step.goal.userId !== userId) {
      return NextResponse.json({ error: "단계를 찾을 수 없습니다." }, { status: 404 });
    }

    if (step.childSteps.length > 0) {
      return NextResponse.json({ error: "이미 구체화된 업무입니다." }, { status: 409 });
    }

    const breakdown = await generateBreakdown({
      goalTitle: step.goal.title,
      stepTitle: step.title,
      stepDescription: step.description,
    });

    // 부모 단계는 컨테이너로 유지하고, 첫 하위 행동만 즉시 실행 가능하게 엽니다.
    await prisma.taskStep.createMany({
      data: breakdown.steps.map((child, index) => ({
        goalId: step.goalId,
        parentStepId: step.id,
        order: index,
        title: child.title,
        description: child.description,
        status: index === 0 ? TaskStatus.ACTIVE : TaskStatus.LOCKED,
      })),
    });

    const goal = await prisma.goal.findFirstOrThrow({
      where: { id: step.goalId, userId },
      include: { steps: true },
    });

    return NextResponse.json({ goal: serializeGoal(goal) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof AiResponseError
            ? error.message
            : "업무를 더 구체화하지 못했습니다. AI 응답 또는 DB 설정을 확인해 주세요.",
      },
      { status: 500 },
    );
  }
}
