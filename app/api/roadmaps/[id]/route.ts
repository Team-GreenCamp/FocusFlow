import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { serializeGoal } from "@/lib/roadmap";

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
