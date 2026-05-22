import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { AiResponseError, generateDailyReflection } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as { memo?: string; goalId?: string };
    const memo = body.memo?.trim();

    if (!memo) {
      return NextResponse.json({ error: "회고에 반영할 한 줄 메모를 입력해 주세요." }, { status: 400 });
    }

    if (body.goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: body.goalId, userId },
        select: { id: true },
      });

      if (!goal) {
        return NextResponse.json({ error: "업무 분석 결과를 찾을 수 없습니다." }, { status: 404 });
      }
    }

    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const completedSteps = await prisma.taskStep.findMany({
      where: {
      status: TaskStatus.DONE,
      completedAt: { gte: since },
      ...(body.goalId ? { goalId: body.goalId } : {}),
      goal: { userId },
    },
      orderBy: { completedAt: "asc" },
    });

    await prisma.dailyNote.create({
      data: { userId, date: since, memo },
    });

    const reflection = await generateDailyReflection({
      memo,
      completedStepTitles: completedSteps.map((step) => step.title),
    });

    const saved = await prisma.reflection.create({
      data: {
        goalId: body.goalId,
        userId,
        date: since,
        memo,
        markdown: reflection.markdown,
      },
    });

    return NextResponse.json({ reflection: saved });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof AiResponseError
            ? error.message
            : "회고를 생성하지 못했습니다. AI 응답 또는 DB 설정을 확인해 주세요.",
      },
      { status: 500 },
    );
  }
}
