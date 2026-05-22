import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal, unlockNextStep } from "@/lib/roadmap";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  let memo: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.memo === "string") {
      memo = body.memo.trim() || null;
    }
  } catch {
    // Body가 없을 때 예외 무시
  }

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

  const completedStep = await prisma.taskStep.update({
    where: { id },
    data: { status: TaskStatus.DONE, completedAt: new Date(), memo },
  });

  await unlockNextStep(completedStep);

  const goal = await prisma.goal.findFirstOrThrow({
    where: { id: completedStep.goalId, userId },
    include: { steps: true },
  });

  return NextResponse.json({ goal: serializeGoal(goal) });
}
