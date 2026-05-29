import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { readPrimaryCalendarEvents, createPrimaryCalendarEvent, deletePrimaryCalendarEvent } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 구글 캘린더 일정 조회 API
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const events = await readPrimaryCalendarEvents(userId);
    return NextResponse.json({ events });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Calendar 일정을 불러오지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

// 구글 캘린더 일정 직접 등록 API (특정 TaskStep의 googleEventId 바인딩 포함)
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      start?: string;
      end?: string;
      stepId?: string; // 업무 단계 ID 추가
    };

    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const start = body.start;
    const end = body.end;
    const stepId = body.stepId?.trim();

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: "필수 정보(제목, 시작 시간, 종료 시간)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const result = await createPrimaryCalendarEvent(userId, {
      title,
      description,
      start,
      end,
    });

    // 특정 업무 단계(TaskStep)와 연동된 일정 생성인 경우, 해당 단계 레코드에 구글 이벤트 ID 기록
    if (stepId) {
      await prisma.taskStep.update({
        where: { id: stepId },
        data: { googleEventId: result.id },
      });
    }

    return NextResponse.json({ success: true, event: result });
  } catch (error) {
    console.error("구글 일정 생성 에러:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Calendar에 일정을 등록하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}

// 구글 캘린더 일정 삭제 API
export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "삭제할 일정 ID가 누락되었습니다." }, { status: 400 });
    }

    // 구글 캘린더 일정 삭제 실행
    await deletePrimaryCalendarEvent(userId, eventId);

    // [추가 연동 가드] 만약 이 일정을 통해 바인딩된 TaskStep이 있다면 googleEventId를 비워주어
    // 중복 등록 버튼이 다시 활성화되도록 유연하게 연동해 줍니다!
    await prisma.taskStep.updateMany({
      where: { googleEventId: eventId },
      data: { googleEventId: null },
    });

    // 만약 이 일정으로 생성된 Goal이 있다면, 연동을 끊어줍니다.
    await prisma.goal.updateMany({
      where: { googleEventId: eventId },
      data: { googleEventId: null },
    });

    return NextResponse.json({ success: true, message: "일정이 삭제되었습니다." });
  } catch (error) {
    console.error("구글 일정 삭제 에러:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Google Calendar 일정을 삭제하지 못했습니다.",
      },
      { status: 500 }
    );
  }
}
