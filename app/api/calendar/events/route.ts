import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { readPrimaryCalendarEvents } from "@/lib/google-calendar";

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
      { status: 500 },
    );
  }
}
