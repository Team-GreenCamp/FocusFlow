import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { AiResponseError, generateDailyReflection } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    const reflectionSchema = z.object({
      memo: z
        .string({ required_error: "회고에 반영할 한 줄 메모를 입력해 주세요." })
        .trim()
        .min(1, "회고에 반영할 한 줄 메모를 입력해 주세요."),
      goalId: z.string().trim().optional().or(z.string().length(0)),
    });

    const validation = reflectionSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || "요청 데이터가 유효하지 않습니다.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { memo, goalId } = validation.data;
    const finalGoalId = goalId || undefined;

    if (finalGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: finalGoalId, userId },
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
        ...(finalGoalId ? { goalId: finalGoalId } : {}),
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
        goalId: finalGoalId || null,
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
