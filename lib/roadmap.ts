import { TaskStatus, type TaskStep } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export function orderSteps<T extends Pick<TaskStep, "parentStepId" | "order" | "createdAt">>(steps: T[]) {
  return [...steps].sort((a, b) => {
    if (a.parentStepId === b.parentStepId) {
      return a.order - b.order || a.createdAt.getTime() - b.createdAt.getTime();
    }

    if (a.parentStepId === null) {
      return -1;
    }

    if (b.parentStepId === null) {
      return 1;
    }

    return a.parentStepId.localeCompare(b.parentStepId);
  });
}

export function serializeGoal(goal: {
  id: string;
  title: string;
  description: string | null;
  googleEventId: string | null;
  steps: TaskStep[];
}) {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    googleEventId: goal.googleEventId,
    steps: orderSteps(goal.steps).map((step) => ({
      id: step.id,
      goalId: step.goalId,
      parentStepId: step.parentStepId,
      order: step.order,
      title: step.title,
      description: step.description,
      status: step.status,
      completedAt: step.completedAt?.toISOString() ?? null,
      memo: step.memo,
      googleEventId: step.googleEventId,
    })),
  };
}

export async function unlockNextStep(completedStep: TaskStep, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const siblings = await tx.taskStep.findMany({
    where: {
      goalId: completedStep.goalId,
      parentStepId: completedStep.parentStepId,
    },
    orderBy: { order: "asc" },
  });
  const nextSibling = siblings.find((step) => step.order > completedStep.order && step.status === TaskStatus.LOCKED);

  if (nextSibling) {
    await tx.taskStep.update({
      where: { id: nextSibling.id },
      data: { status: TaskStatus.ACTIVE },
    });
    return;
  }

  if (!completedStep.parentStepId) {
    return;
  }

  const parent = await tx.taskStep.findUnique({
    where: { id: completedStep.parentStepId },
  });

  if (!parent) {
    return;
  }

  // 하위 단계가 모두 끝나면 부모 단계를 완료하고 다음 루트 단계를 엽니다.
  await tx.taskStep.update({
    where: { id: parent.id },
    data: { status: TaskStatus.DONE, completedAt: new Date() },
  });
  await unlockNextStep(parent, tx);
}
