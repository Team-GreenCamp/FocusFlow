import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const reflections = await prisma.reflection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { goal: true },
  });

  return NextResponse.json({
    reflections: reflections.map((reflection) => ({
      id: reflection.id,
      goalId: reflection.goalId,
      goalTitle: reflection.goal?.title ?? null,
      date: reflection.date.toISOString(),
      memo: reflection.memo,
      markdown: reflection.markdown,
      createdAt: reflection.createdAt.toISOString(),
    })),
  });
}
