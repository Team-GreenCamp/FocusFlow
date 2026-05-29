"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";
import type { CalendarEventSummary } from "@/lib/google-calendar";

// 리프 노드인지 확인하는 헬퍼 함수
function isLeaf(step: RoadmapStep, steps: RoadmapStep[]) {
  return !steps.some((candidate) => candidate.parentStepId === step.id);
}

// 현재 진행해야 하는 ACTIVE 리프 단계 찾기
function findCurrentWorkStep(goal: RoadmapGoal | null) {
  if (!goal) return null;
  return goal.steps.find((step) => step.status === "ACTIVE" && isLeaf(step, goal.steps)) ?? null;
}

export default function Home() {
  const { data: session, status } = useSession();

  // API 상태 관리
  const [goals, setGoals] = useState<RoadmapGoal[]>([]);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 월간 달력 날짜 제어용 상태
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // 달력에서 클릭해서 일정을 자세히 볼 특정 날짜 정보 (기본값: 오늘)
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  // ==================== [ 일정 등록 및 연동 모달 관련 상태 ] ====================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalStartTime, setModalStartTime] = useState("09:00");
  const [modalEndTime, setModalEndTime] = useState("10:00");
  const [modalStepId, setModalStepId] = useState(""); // 연동할 업무(TaskStep) 고유 ID 보관용
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // 비로그인용 슬라이딩 플레이스홀더 설정
  const placeholders = useMemo(() => [
    "예: 바디프로필 촬영을 위한 일주일 식단 구성 및 장보기",
    "예: 하프 마라톤 완주를 위한 단계별 달성 계획 설계",
    "예: 미니멀 라이프 실천을 위한 안 입는 옷 정리하기",
    "예: 월 2권 독서 달성을 위한 매일 30분 독서 루틴 짜기",
    "예: 주말 아침 러닝 및 스트레칭 습관 만들기"
  ], []);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [status, placeholders]);

  // 대시보드 및 캘린더 데이터를 서버로부터 다시 패치하는 코어 함수
  async function loadDashboardData() {
    try {
      const [calendarRes, roadmapsRes] = await Promise.all([
        fetch("/api/calendar/events"),
        fetch("/api/roadmaps")
      ]);

      const calendarData = await calendarRes.json();
      const roadmapsData = await roadmapsRes.json();

      if (!calendarRes.ok && calendarData.error) {
        console.warn("구글 캘린더 로딩 중 오류 발생:", calendarData.error);
      } else {
        setEvents(calendarData.events ?? []);
      }

      if (!roadmapsRes.ok && roadmapsData.error) {
        throw new Error(roadmapsData.error);
      } else {
        setGoals(roadmapsData.goals ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "대시보드 정보를 불러오지 못했습니다.");
    }
  }

  // 로그인 시 최초 데이터 로딩
  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadDashboardData().finally(() => setLoading(false));
  }, [status]);

  // 달력 격자(6주 고정 = 42칸) 계산 엔진
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; day: number; isCurrentMonth: boolean }[] = [];

    // 1. 저번 달 빈 칸 채우기
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(prevDay).padStart(2, "0")}`;
      cells.push({ dateStr, day: prevDay, isCurrentMonth: false });
    }

    // 2. 이번 달 일수 채우기
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dateStr, day: i, isCurrentMonth: true });
    }

    // 3. 다음 달 빈 칸 채우기 (42칸 고정)
    const nextDaysNeeded = 42 - cells.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({ dateStr, day: i, isCurrentMonth: false });
    }

    return cells;
  }, [currentDate]);

  // 날짜별 이벤트 맵 생성 (렌더링 최적화)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventSummary[]> = {};
    events.forEach((event) => {
      if (!event.start) return;
      const dateStr = event.start.split("T")[0];
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(event);
    });
    return map;
  }, [events]);

  // 클릭해서 선택한 날짜의 상세 일정 목록
  const selectedDateEvents = useMemo(() => {
    return eventsByDate[selectedDateStr] ?? [];
  }, [selectedDateStr, eventsByDate]);

  // 달력 월 변경 핸들러
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    );
  };

  // 시간 포맷팅 헬퍼
  const formatTime = (isoString: string | null, allDay: boolean) => {
    if (!isoString) return "";
    if (allDay) return "하루 종일";
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false
    }).format(date);
  };

  // 선택된 날짜 타이틀 예쁘게 표시
  const formattedSelectedDate = useMemo(() => {
    const d = new Date(selectedDateStr);
    return new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(d);
  }, [selectedDateStr]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  }, []);

  // ==================== [ 일정 등록 및 연동 핸들러 ] ====================
  
  // A. 일반 일정 생성 폼 열기
  const openCreateEventModal = () => {
    setModalTitle("");
    setModalDescription("");
    setModalDate(selectedDateStr);
    setModalStartTime("09:00");
    setModalEndTime("10:00");
    setModalStepId(""); // 일반 추가이므로 stepId 초기화
    setModalError("");
    setIsModalOpen(true);
  };

  // B. 나의 업무(TaskStep) 연동하여 일정 폼 채우고 열기
  const openTaskSyncModal = (goalTitle: string, step: RoadmapStep) => {
    setModalTitle(`[업무] ${step.title}`);
    setModalDescription(`목표: ${goalTitle}\n---\n설명: ${step.description}`);
    
    // 기본 날짜는 오늘로 세팅합니다.
    setModalDate(todayStr);
    
    // 시작 시간은 현재 시간 기준 다음 시간으로 똑똑하게 세팅합니다.
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = (currentHour + 1) % 24;
    const endHour = (currentHour + 2) % 24;
    
    setModalStartTime(`${String(nextHour).padStart(2, "0")}:00`);
    setModalEndTime(`${String(endHour).padStart(2, "0")}:00`);
    setModalStepId(step.id); // 연동할 업무 ID 저장
    setModalError("");
    setIsModalOpen(true);
  };

  // C. 실제 구글 캘린더에 일정 등록 API 호출
  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError("일정 제목을 입력해 주세요.");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      const startDateTime = `${modalDate}T${modalStartTime}:00`;
      const endDateTime = `${modalDate}T${modalEndTime}:00`;

      // API 호출 시 stepId가 있으면 body에 함께 담아 전송하여 DB 바인딩을 유도합니다.
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: modalTitle,
          description: modalDescription,
          start: new Date(startDateTime).toISOString(),
          end: new Date(endDateTime).toISOString(),
          stepId: modalStepId || undefined
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error ?? "구글 일정 등록에 실패했습니다.");
      }

      // 성공 시 즉각 모달을 닫고, 대시보드 리렌더링
      setIsModalOpen(false);
      setLoading(true);
      await loadDashboardData();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "일정 등록 중 알 수 없는 에러가 발생했습니다.");
    } finally {
      setModalLoading(false);
      setLoading(false);
    }
  };

  const deleteGoal = async (goalId: string, goalTitle: string) => {
    if (!confirm(`"${goalTitle}" 업무를 정말로 삭제하시겠습니까?\n이 목표에 포함된 모든 단계가 함께 영구 삭제됩니다.`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/roadmaps/${goalId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "업무 삭제에 실패했습니다.");
      }

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업무 삭제 중 알 수 없는 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCalendarEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`"${eventTitle}" 일정을 구글 캘린더에서 정말로 삭제하시겠습니까?\n연동된 업무 정보도 함께 동기화가 해제됩니다.`)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/calendar/events?eventId=${eventId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "일정 삭제에 실패했습니다.");
      }

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 삭제 중 알 수 없는 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-hidden">
      {/* 백그라운드 리퀴드 글래스 블롭 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[15%] w-[350px] h-[350px] rounded-full bg-primary/10 blur-[80px] animate-blob-1" />
        <div className="absolute top-[25%] right-[15%] w-[450px] h-[450px] rounded-full bg-secondary/8 blur-[100px] animate-blob-2" />
        <div className="absolute bottom-[20%] left-[25%] w-[380px] h-[380px] rounded-full bg-primary/8 blur-[90px] animate-blob-3" />
      </div>

      {/* Header */}
      <Header />

      {/* Main Content Canvas */}
      <main className="relative z-10 pt-24 px-margin-mobile md:px-gutter pb-margin-desktop max-w-7xl mx-auto w-full min-h-screen flex flex-col">
        {loading ? (
          // ==================== [ 로딩 중 스켈레톤 UI ] ====================
          <div className="w-full flex-grow flex flex-col gap-6 py-12 animate-pulse">
            <div className="h-10 w-48 bg-surface-container rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-6 w-32 bg-surface-container rounded" />
                <div className="h-96 bg-surface-container/40 rounded-2xl border border-outline-variant/10" />
              </div>
              <div className="lg:col-span-4 space-y-4">
                <div className="h-6 w-32 bg-surface-container rounded" />
                <div className="h-96 bg-surface-container/40 rounded-2xl border border-outline-variant/10" />
              </div>
            </div>
          </div>
        ) : status === "authenticated" ? (
          // ==================== [ 로그인 상태 대시보드 뷰 ] ====================
          <div className="w-full flex-grow flex flex-col gap-8 py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/20 pb-5">
              <div>
                <h1 className="font-headline-lg text-3xl font-bold tracking-tight text-on-surface">
                  {session?.user?.name ? `${session.user.name}님의 몰입 대시보드` : "나의 몰입 대시보드"}
                </h1>
                <p className="text-on-surface-variant font-body-md mt-1">
                  구글 캘린더 달력과 나의 몰입 업무를 유기적으로 한눈에 분석하고 실행하세요.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/breakdown"
                  className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary/95 transition-all text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-sm font-bold">add</span>
                  업무 구체화하기
                </Link>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-error-container/20 border border-error/20 px-4 py-3 text-sm text-error font-medium">
                {error}
              </p>
            )}

            {/* Dashboard Grid (월간 달력 및 양방향 동기화) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 좌측 (12열 중 8열 배정): 인터랙티브 월간 달력 그리드 */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1">
                  
                  {/* 달력 제목 구글 이동 링킹 숏컷 장착 */}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2 group hover:text-primary transition-colors cursor-pointer"
                    title="구글 캘린더 새 창에서 열기"
                  >
                    <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
                    <span>구글 캘린더 달력</span>
                    <span className="material-symbols-outlined text-outline text-sm group-hover:text-primary transition-colors">open_in_new</span>
                  </a>
                  
                  {/* 달력 컨트롤러 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToday}
                      className="px-3 py-1 bg-surface-container-high/60 border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container transition-all"
                    >
                      오늘
                    </button>
                    <div className="flex items-center bg-surface-container-low/40 rounded-lg border border-outline-variant/30 px-1 py-0.5">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                        aria-label="이전 달"
                      >
                        <span className="material-symbols-outlined text-base">chevron_left</span>
                      </button>
                      <span className="text-xs font-bold text-on-surface px-2.5 min-w-[75px] text-center">
                        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                        aria-label="다음 달"
                      >
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 실제 달력 그리드 카드 */}
                <div className="glass-card p-5 rounded-3xl border border-outline-variant/20 shadow-md">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-outline mb-2.5">
                    <div className="text-error/85 py-1">일</div>
                    <div className="py-1">월</div>
                    <div className="py-1">화</div>
                    <div className="py-1">수</div>
                    <div className="py-1">목</div>
                    <div className="py-1">금</div>
                    <div className="text-primary/80 py-1">토</div>
                  </div>

                  {/* 42칸 날짜 셀 격자 */}
                  <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                    {calendarCells.map(({ dateStr, day, isCurrentMonth }) => {
                      const dayEvents = eventsByDate[dateStr] ?? [];
                      const isToday = dateStr === todayStr;
                      const isSelected = dateStr === selectedDateStr;
                      
                      const dayOfWeek = new Date(dateStr).getDay();

                      return (
                        <div
                          key={dateStr}
                          onClick={() => setSelectedDateStr(dateStr)}
                          className={`min-h-[75px] md:min-h-[90px] p-1.5 md:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-primary/10 border-primary ring-1 ring-primary"
                              : isToday
                                ? "bg-surface-container-high/40 border-secondary"
                                : isCurrentMonth
                                  ? "bg-surface-container-lowest/20 border-outline-variant/15 hover:border-primary/45"
                                  : "bg-surface-container-low/10 border-transparent opacity-35 hover:opacity-50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-xs font-bold leading-none w-5 h-5 flex items-center justify-center rounded-full ${
                                isToday
                                  ? "bg-secondary text-on-secondary shadow-sm"
                                  : dayOfWeek === 0
                                    ? "text-error"
                                    : dayOfWeek === 6
                                      ? "text-primary"
                                      : "text-on-surface"
                              }`}
                            >
                              {day}
                            </span>
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] font-bold text-secondary bg-secondary/15 px-1 py-0.5 rounded-full shrink-0">
                                +{dayEvents.length - 2}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 mt-1.5 overflow-hidden">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                title={event.title}
                                className="text-[9px] md:text-[10px] font-medium bg-primary/10 text-primary truncate px-1.5 py-0.5 rounded-md border border-primary/5 line-clamp-1"
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 우측 (12열 중 4열 배정): 선택일정 상세 패널 및 할일 목록 */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* 1. 선택된 날짜의 구체적 일정 타임라인 */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-1.5 pl-1">
                    <span className="material-symbols-outlined text-secondary text-lg">event_available</span>
                    {formattedSelectedDate}
                  </h3>
                  
                  <div className="glass-card p-5 rounded-2xl min-h-[180px] flex flex-col justify-between">
                    {selectedDateEvents.length === 0 ? (
                      <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                        <span className="material-symbols-outlined text-outline/60 text-3xl mb-2">calendar_today</span>
                        <p className="text-on-surface-variant text-xs break-keep leading-relaxed">
                          해당 날짜에 등록된 <br />
                          구글 캘린더 일정이 없습니다.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
                        {selectedDateEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-primary/20 transition-all flex flex-col gap-1"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-bold text-xs text-on-surface line-clamp-1">
                                {event.title}
                              </h5>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                  {formatTime(event.start, event.allDay)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteCalendarEvent(event.id, event.title)}
                                  className="text-on-surface-variant hover:text-error transition-colors p-0.5 rounded hover:bg-surface-container flex items-center justify-center"
                                  title="이 일정 구글 캘린더에서 삭제"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              </div>
                            </div>
                            {event.location && (
                              <div className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[10px]">location_on</span>
                                {event.location}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="border-t border-outline-variant/15 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
                      <span className="text-outline font-medium">일정 총 {selectedDateEvents.length}개</span>
                      <button
                        onClick={openCreateEventModal}
                        className="text-primary font-bold flex items-center gap-0.5 hover:underline"
                      >
                        내 캘린더에 일정 등록
                        <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. 몰입 할일 및 진행률 요약 (구글 캘린더 직접 연동 및 앵커링 스크롤 포함) */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-1.5 pl-1">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                    목표 몰입 할일 ({goals.length}개)
                  </h3>

                  <div className="glass-card p-5 rounded-2xl min-h-[180px] flex flex-col justify-between border border-outline-variant/20 shadow-md">
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-0.5">
                      {goals.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                          <span className="material-symbols-outlined text-outline/60 text-3xl mb-2">task_alt</span>
                          <p className="text-on-surface-variant text-xs break-keep leading-relaxed">
                            진행 중인 몰입 목표가 없습니다.
                          </p>
                        </div>
                      ) : (
                        goals.slice(0, 3).map((goal) => {
                          const leafSteps = goal.steps.filter((s) => isLeaf(s, goal.steps));
                          const completedLeaf = leafSteps.filter((s) => s.status === "DONE");
                          const progress = leafSteps.length > 0 ? Math.round((completedLeaf.length / leafSteps.length) * 100) : 0;
                          const activeStep = findCurrentWorkStep(goal);

                          // 캘린더 동기화 및 완료 여부 파악
                          const isSynced = activeStep && activeStep.googleEventId;
                          const isDone = activeStep && activeStep.status === "DONE";

                          return (
                            <div
                              key={goal.id}
                              className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/20 hover:border-secondary/20 transition-all flex flex-col gap-3 relative overflow-hidden"
                            >
                              <div className="flex justify-between items-center gap-2 border-b border-outline-variant/15 pb-2">
                                <h4 className="font-bold text-sm text-on-surface truncate max-w-[50%]">
                                  {goal.title}
                                </h4>
                                
                                <div className="flex items-center gap-3">
                                  {/* 상세 링크 대상을 실제 /roadmaps/[id]#roadmap-list-section 으로 변경하여 극상의 스크롤 포커싱 UX 제공 */}
                                  <Link
                                    href={`/roadmaps/${goal.id}#roadmap-list-section`}
                                    className="text-[10px] text-outline font-bold flex items-center gap-0.5 hover:text-primary hover:underline transition-colors"
                                  >
                                    상세
                                    <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => deleteGoal(goal.id, goal.title)}
                                    className="text-[10px] text-outline font-bold flex items-center gap-0.5 hover:text-error hover:underline transition-colors animate-fade-in"
                                    title="이 업무 전체 삭제"
                                  >
                                    삭제
                                    <span className="material-symbols-outlined text-[11px]">delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* 진행 바 */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-outline">
                                  <span>완료율</span>
                                  <span className="text-secondary">{progress}% ({completedLeaf.length}/{leafSteps.length})</span>
                                </div>
                                <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-secondary rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* 액티브 다음 행동 및 달력 중복 가드 등록 제어 */}
                              {activeStep && (
                                <div className="p-2.5 rounded-lg bg-surface-container-lowest/30 border border-outline-variant/20 flex items-center justify-between gap-3">
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <span className="text-[8.5px] text-primary font-bold tracking-widest uppercase">
                                      NEXT
                                    </span>
                                    <h5 className="font-semibold text-xs text-on-surface truncate">
                                      {activeStep.title}
                                    </h5>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    
                                    {/* 중복 연동 가드 UI 제어 */}
                                    {isDone ? (
                                      // 1. 이미 완료된 업무면 달력 추가 아이콘 노출 자체를 원천 차단
                                      null
                                    ) : isSynced ? (
                                      // 2. 이미 달력에 동기화가 성공했다면, 초록색 등록 완료 배지 및 클릭 차단
                                      <div
                                        title="구글 캘린더에 이미 연동된 몰입 업무입니다"
                                        className="p-1 px-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 rounded text-[9.5px] font-bold flex items-center gap-0.5 select-none shrink-0"
                                      >
                                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                        등록됨
                                      </div>
                                    ) : (
                                      // 3. 아직 동기화 전이고 완료 안 된 활성 상태일 때만 정상적으로 등록 단축키 노출
                                      <button
                                        onClick={() => openTaskSyncModal(goal.title, activeStep)}
                                        title="이 업무를 내 달력 일정에 추가하기"
                                        className="p-1.5 bg-surface-container border border-outline-variant text-on-surface-variant hover:text-secondary rounded transition-all hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
                                      </button>
                                    )}

                                    <Link
                                      href="/deep-work"
                                      className="px-2.5 py-1.5 bg-primary text-white font-bold rounded text-[10px] shadow hover:bg-primary/95 transition-all flex items-center gap-0.5 shrink-0"
                                    >
                                      <span className="material-symbols-outlined text-[10px]">bolt</span>
                                      집중
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-outline-variant/15 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
                      <span className="text-outline font-medium">진행 중인 목표 총 {goals.length}개</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : (
          // ==================== [ 비로그인 상태 랜딩 Hero UI ] ====================
          <div className="w-full flex-grow flex flex-col items-center">
            {/* Landing Hero Section */}
            <section className="w-full text-center py-16 md:py-24 flex flex-col items-center justify-center border-b border-outline-variant/20 mb-16 relative">
              <h1 className="font-display-lg text-4xl md:text-6xl font-bold tracking-tight text-on-surface max-w-3xl leading-tight mb-6 break-keep">
                뇌의 인지 과부하를 비우고 <br />
                <span className="momentum-gradient">몰입의 흐름</span>에 올라타세요
              </h1>
              <p className="text-on-surface-variant font-body-lg text-lg md:text-xl max-w-2xl leading-relaxed mb-10 break-keep">
                복잡하고 막연한 머릿속 업무 아이디어를 즉시 실행 가능한 마이크로 태스크로 세분화합니다. 집중을 유지하고 일일 회고 루프를 완성하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 duration-200"
                >
                  구글 로그인하여 시작하기
                </Link>
              </div>
            </section>

            {/* Features Info Section */}
            <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">인지 과부하 완화</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
                  추상적이고 막막한 목표를 논리적 순서를 갖춘 세부 태스크로 세분화하여, 시작 전 뇌의 의사결정 에너지를 절약합니다.
                </p>
              </div>

              <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-secondary text-2xl">bolt</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">몰입형 뽀모도로</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
                  한 번에 단 하나의 구체화된 업무에만 오롯이 몰입하도록 유도하며, 인지 상태를 최적으로 유지해주는 집중 타겟 가이드를 제공합니다.
                </p>
              </div>

              <div className="glass-card p-8 rounded-2xl flex flex-col items-start text-left relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl">loop</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-3">피드백 기반 성장</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed break-keep">
                  실제 수행한 업무의 완수 내역과 단기 메모를 하나로 모아 심층 회고 피드백을 생성함으로써, 명확한 내일의 개선점을 제안합니다.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ==================== [ 구글 일정 등록 팝업 모달 ] ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="glass-card p-6 md:p-7 rounded-3xl w-full max-w-md border border-outline-variant/30 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-5">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_add_on</span>
                구글 캘린더에 일정 등록
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              
              {/* 일정 제목 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-outline uppercase pl-0.5">일정 제목</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="예: FocusFlow 일정 추가"
                  className="w-full px-4 h-11 bg-white/40 dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-on-surface font-semibold"
                />
              </div>

              {/* 일정 설명 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-outline uppercase pl-0.5">상세 설명 (메모)</label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="일정에 관한 설명이나 준비물을 적어보세요."
                  className="w-full p-4 min-h-20 resize-none bg-white/40 dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-on-surface leading-relaxed"
                />
              </div>

              {/* 날짜 및 시간 영역 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 날짜 선택 */}
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-outline uppercase pl-0.5">날짜</label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 h-11 bg-white/40 dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-on-surface"
                  />
                </div>

                {/* 시간 설정 */}
                <div className="grid grid-cols-2 gap-2 col-span-2 sm:col-span-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline uppercase pl-0.5">시작</label>
                    <input
                      type="time"
                      required
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-2 h-11 bg-white/40 dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-on-surface"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-outline uppercase pl-0.5">종료</label>
                    <input
                      type="time"
                      required
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-2 h-11 bg-white/40 dark:bg-surface-container-high/40 border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-on-surface"
                    />
                  </div>
                </div>
              </div>

              {modalError && (
                <p className="rounded-lg bg-error-container/20 border border-error/20 px-3 py-2 text-xs text-error font-medium">
                  {modalError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-outline-variant/20 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-surface-container border border-outline-variant/30 text-on-surface-variant text-xs font-bold rounded-xl hover:bg-surface-container-high active:scale-98 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 h-11 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 active:scale-98 transition-all flex items-center justify-center"
                >
                  {modalLoading ? "등록하는 중..." : "일정 추가"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
