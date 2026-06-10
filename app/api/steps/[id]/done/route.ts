import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal, unlockNextStep } from "@/lib/roadmap";
import { z } from "zod";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown = {};
  const bodyText = await request.text();
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "올바르지 않은 JSON 요청 형식입니다." }, { status: 400 });
    }
  }

  const doneSchema = z.object({
    memo: z.string().trim().nullable().optional(),
  });

  const validation = doneSchema.safeParse(body);
  if (!validation.success) {
    const errorMsg = validation.error.errors[0]?.message || "요청 데이터가 유효하지 않습니다.";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const memo = validation.data.memo || null;

  const step = await prisma.taskStep.findUnique({
    where: { id },
    include: { childSteps: true, goal: true },
  });

  if (!step || step.goal.userId !== userId) {
    return NextResponse.json({ error: "단계를 찾을 수 없습니다." }, { status: 404 });
  }

  if (step.childSteps.some((child) => child.status !== TaskStatus.DONE)) {
    return NextResponse.json({ error: "하위 단계를 먼저 완료해 주세요." }, { status: 409 });
  }

  // 트랜잭션을 사용하여 완료 처리 및 LOCKED 해제를 원자적으로 수행합니다.
  const goal = await prisma.$transaction(async (tx) => {
    const completedStep = await tx.taskStep.update({
      where: { id },
      data: { status: TaskStatus.DONE, completedAt: new Date(), memo },
    });

    await unlockNextStep(completedStep, tx);

    return await tx.goal.findFirstOrThrow({
      where: { id: completedStep.goalId, userId },
      include: { steps: true },
    });
  });

  return NextResponse.json({ goal: serializeGoal(goal) });
}
