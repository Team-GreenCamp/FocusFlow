import { prisma } from "@/lib/prisma";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
};

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEvent[];
  error?: {
    message?: string;
  };
};

export type CalendarEventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  htmlLink: string | null;
  start: string | null;
  end: string | null;
  allDay: boolean;
};

async function refreshAccessToken(account: {
  id: string;
  refresh_token: string | null;
}) {
  if (!account.refresh_token) {
    throw new Error("캘린더 권한 갱신 토큰이 없습니다. Google 로그인을 다시 진행해 주세요.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const token = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || !token.access_token) {
    throw new Error(token.error_description ?? token.error ?? "Google access token 갱신에 실패했습니다.");
  }

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: token.access_token,
      expires_at: token.expires_in ? Math.floor(Date.now() / 1000) + token.expires_in : undefined,
      token_type: token.token_type,
      scope: token.scope,
    },
  });

  return token.access_token;
}

export async function getGoogleAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account) {
    throw new Error("Google 계정 연결을 찾을 수 없습니다.");
  }

  const expiresAt = account.expires_at ?? 0;
  const isFresh = account.access_token && expiresAt > Math.floor(Date.now() / 1000) + 60;
  if (isFresh) {
    return account.access_token;
  }

  return refreshAccessToken(account);
}

export async function readPrimaryCalendarEvents(userId: string) {
  const accessToken = await getGoogleAccessToken(userId);
  const now = new Date();
  const until = new Date(now);
  until.setDate(until.getDate() + 7);

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: until.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "10",
  });

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as GoogleCalendarEventsResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Google Calendar 일정을 불러오지 못했습니다.");
  }

  return (data.items ?? []).map((event): CalendarEventSummary => {
    const start = event.start?.dateTime ?? event.start?.date ?? null;
    const end = event.end?.dateTime ?? event.end?.date ?? null;

    return {
      id: event.id,
      title: event.summary ?? "제목 없는 일정",
      description: event.description ?? null,
      location: event.location ?? null,
      htmlLink: event.htmlLink ?? null,
      start,
      end,
      allDay: Boolean(event.start?.date && !event.start?.dateTime),
    };
  });
}
