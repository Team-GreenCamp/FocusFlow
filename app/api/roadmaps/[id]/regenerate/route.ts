import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { z } from "zod";
import { generateRoadmap } from "@/lib/ai/vertex";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";

const regenerateSchema = z.object({
  goal: z.string().trim().min(1, "목표 제목을 입력해 주세요."),
  context: z.string().trim().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const validation = regenerateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message ?? "재생성할 목표 정보가 유효하지 않습니다." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "재생성할 목표를 찾을 수 없습니다." }, { status: 404 });
    }

    const roadmap = await generateRoadmap(validation.data.goal, validation.data.context);

    // 목표 ID와 캘린더 연결은 유지하고 실행 단계만 새 AI 결과로 교체합니다.
    const goal = await prisma.$transaction(async (tx) => {
      await tx.taskStep.deleteMany({
        where: { goalId: id },
      });

      return tx.goal.update({
        where: { id },
        data: {
          title: validation.data.goal,
          description: validation.data.context || null,
          steps: {
            create: roadmap.steps.map((step, index) => ({
              title: step.title,
              description: step.description,
              // 시간 추정은 사용하지 않지만 기존 DB 필수 컬럼에는 호환값을 저장합니다.
              estimateMinutes: 1,
              order: index,
              status: index === 0 ? TaskStatus.ACTIVE : TaskStatus.LOCKED,
            })),
          },
        },
        include: { steps: true },
      });
    });

    return NextResponse.json({ goal: serializeGoal(goal) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "업무를 다시 생성하지 못했습니다. AI 응답 또는 DB 설정을 확인해 주세요." },
      { status: 500 },
    );
  }
}
