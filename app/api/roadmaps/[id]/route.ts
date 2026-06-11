import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
    include: { steps: true },
  });

  if (!goal) {
    return NextResponse.json({ error: "업무 분석 결과를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ goal: serializeGoal(goal) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const updateSchema = z.object({
    title: z.string().trim().min(1, "목표 제목을 입력해 주세요."),
    description: z.string().trim().optional(),
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "올바르지 않은 JSON 요청 형식입니다." }, { status: 400 });
  }

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message ?? "수정할 목표 정보가 유효하지 않습니다." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const existingGoal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!existingGoal) {
    return NextResponse.json({ error: "수정할 목표를 찾을 수 없습니다." }, { status: 404 });
  }

  // 목표 정보만 수정하고 기존 진행 단계와 완료 기록은 유지합니다.
  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: validation.data.title,
      description: validation.data.description || null,
    },
    include: { steps: true },
  });

  return NextResponse.json({ goal: serializeGoal(goal) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  // 본인의 목표인지 검증 후 안전하게 삭제 진행
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    return NextResponse.json({ error: "해당 업무를 찾을 수 없거나 삭제 권한이 없습니다." }, { status: 404 });
  }

  // 트랜잭션을 적용하여 하위 steps, reflections 등 연쇄 데이터를 안전하게 삭제합니다.
  await prisma.$transaction(async (tx) => {
    // 1. Goal과 연관된 reflections 삭제
    await tx.reflection.deleteMany({
      where: { goalId: id },
    });

    // 2. Goal 삭제 (onDelete: Cascade 설정에 의해 TaskStep들은 자동으로 삭제됩니다)
    await tx.goal.delete({
      where: { id },
    });
  });

  return NextResponse.json({ success: true, message: "업무가 성공적으로 삭제되었습니다." });
}
