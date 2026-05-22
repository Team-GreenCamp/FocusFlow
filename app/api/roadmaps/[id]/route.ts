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
