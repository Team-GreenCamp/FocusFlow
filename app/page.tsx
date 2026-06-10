"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import type { RoadmapGoal, RoadmapStep } from "@/types/roadmap";
import type { CalendarEventSummary } from "@/lib/google-calendar";

// 새로 추출한 4가지의 독립 조립식 클린 컴포넌트들 임포트
import CreateEventModal from "@/components/dashboard/CreateEventModal";
import CalendarSection from "@/components/dashboard/CalendarSection";
import TimelineSection from "@/components/dashboard/TimelineSection";
import ActiveGoalSection from "@/components/dashboard/ActiveGoalSection";

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

  // 신규 이식: 구글 일정 양방향 편집 및 강제 동기화 관련 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // 선택된 날짜에 연동된 목표만 필터링 (구글 일정 ID 매칭 및 지능형 텍스트 유사성 매칭 이중 필터링)
  const filteredGoals = useMemo(() => {
    if (selectedDateEvents.length === 0) return [];

    const selectedEventIds = selectedDateEvents.map((event) => event.id);

    return goals.filter((goal) => {
      // 1. 고유 ID 기반 매칭 (최우선)
      const isGoalLinked = goal.googleEventId ? selectedEventIds.includes(goal.googleEventId) : false;
      const isStepLinked = goal.steps.some((step) =>
        step.googleEventId ? selectedEventIds.includes(step.googleEventId) : false
      );
      if (isGoalLinked || isStepLinked) return true;

      // 2. 지능형 텍스트 유사성 매칭 (Title/Description 스마트 서치)
      const normalizedGoalTitle = goal.title.replace(/\s+/g, "").toLowerCase();

      return selectedDateEvents.some((event) => {
        // [업무] 프리픽스 및 공백 제거 처리
        const normalizedEventTitle = event.title
          .replace(/^\[업무\]\s*/i, "")
          .replace(/\s+/g, "")
          .toLowerCase();

        const normalizedEventDesc = event.description
          ? event.description.replace(/\s+/g, "").toLowerCase()
          : "";

        // A. 목표 제목과의 매칭
        const isGoalTitleMatched =
          normalizedEventTitle.includes(normalizedGoalTitle) ||
          normalizedGoalTitle.includes(normalizedEventTitle) ||
          normalizedEventDesc.includes(normalizedGoalTitle);

        if (isGoalTitleMatched) return true;

        // B. 세부 단계(Steps) 중 제목과의 매칭
        return goal.steps.some((step) => {
          const normalizedStepTitle = step.title.replace(/\s+/g, "").toLowerCase();
          return (
            normalizedEventTitle.includes(normalizedStepTitle) ||
            normalizedStepTitle.includes(normalizedEventTitle) ||
            normalizedEventDesc.includes(normalizedStepTitle)
          );
        });
      });
    });
  }, [goals, selectedDateEvents]);

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
    setIsEditMode(false);
    setEditingEventId("");
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
    setIsEditMode(false);
    setEditingEventId("");
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

  // 신규 C. 일정 클릭 시 수정 모드 폼 열기
  const openEditEventModal = (event: CalendarEventSummary) => {
    setIsEditMode(true);
    setEditingEventId(event.id);
    setModalTitle(event.title);
    setModalDescription(event.description ?? "");
    setModalStepId(""); // 수정 시에는 신규 바인딩 ID 생략

    if (event.start) {
      const parts = event.start.split("T");
      setModalDate(parts[0]);
      if (parts[1]) {
        setModalStartTime(parts[1].slice(0, 5));
      } else {
        setModalStartTime("09:00");
      }
    } else {
      setModalDate(selectedDateStr);
      setModalStartTime("09:00");
    }

    if (event.end && event.end.includes("T")) {
      setModalEndTime(event.end.split("T")[1].slice(0, 5));
    } else {
      setModalEndTime("10:00");
    }

    setModalError("");
    setIsModalOpen(true);
  };

  // 신규 D. 생성 및 수정(PATCH) 통합 제출 핸들러
  const handleCreateOrUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
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

      if (isEditMode) {
        // 수정 모드: PATCH 요청
        const response = await fetch("/api/calendar/events", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            eventId: editingEventId,
            title: modalTitle,
            description: modalDescription,
            start: new Date(startDateTime).toISOString(),
            end: new Date(endDateTime).toISOString()
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error ?? "구글 일정 수정에 실패했습니다.");
        }
      } else {
        // 등록 모드: POST 요청
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
      }

      // 성공 시 폼 초기화 및 새로고침
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingEventId("");
      setLoading(true);
      await loadDashboardData();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "요청 처리 중 알 수 없는 에러가 발생했습니다.");
    } finally {
      setModalLoading(false);
      setLoading(false);
    }
  };

  // 신규 E. 달력 내 일정 드래그 앤 드롭 날짜/시간 업데이트 핸들러
  const handleUpdateEventDate = async (eventId: string, targetDateStr: string) => {
    const targetEvent = events.find((evt) => evt.id === eventId);
    if (!targetEvent) return;

    setLoading(true);
    setError("");

    try {
      // 타임존 접미사 유지를 위해 원래 시각의 시간 부분만 추출해 이식
      const oldStartISO = targetEvent.start || "";
      const startTimePart = oldStartISO.includes("T") ? oldStartISO.split("T")[1] : "09:00:00";
      const newStartISO = new Date(`${targetDateStr}T${startTimePart}`).toISOString();
      
      const oldEndISO = targetEvent.end || "";
      const endTimePart = oldEndISO.includes("T") ? oldEndISO.split("T")[1] : "10:00:00";
      const newEndISO = new Date(`${targetDateStr}T${endTimePart}`).toISOString();

      const response = await fetch("/api/calendar/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          eventId,
          start: newStartISO,
          end: newEndISO
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error ?? "일정 이동 처리에 실패했습니다.");
      }

      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 조율 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 신규 F. 구글 캘린더 강제 즉시 동기화(새로고침) 핸들러
  const handleRefreshCalendar = async () => {
    setIsRefreshing(true);
    setError("");
    try {
      await loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "구글 캘린더 동기화에 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  };


  // D. 로드맵 업무(Goal) 전체 영구 삭제 통신 핸들러
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

  // E. 구글 캘린더 일정 삭제 통신 핸들러 (연동 매핑 자동 해제 포함)
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
    <div className="bg-[#f2f4f6] dark:bg-[#121212] text-[#191f28] dark:text-[#f5f5f7] min-h-screen relative overflow-hidden">
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
          // ==================== [ 로그인 상태 대시보드 뷰 (조립 구조) ] ====================
          <div className="w-full flex-grow flex flex-col gap-8 py-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-5">
              <div>
                <h1 className="font-headline-lg text-3xl font-extrabold tracking-tight text-[#191f28]">
                  {session?.user?.name ? `${session.user.name}님의 몰입 대시보드` : "나의 몰입 대시보드"}
                </h1>
                <p className="text-[#4e5968] font-bold mt-1 text-sm">
                  구글 캘린더 달력과 나의 몰입 업무를 유기적으로 한눈에 분석하고 실행하세요.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/breakdown"
                  className="px-5 py-2.5 bg-[#22a063] text-white font-extrabold rounded-2xl shadow-sm hover:bg-[#1a824e] hover:shadow-md transition-all text-sm flex items-center gap-2 hover:scale-[1.01] active:scale-95 duration-200 border-none"
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
              
              {/* 좌측 (8열): 격리 추출된 인터랙티브 월간 달력 그리드 컴포넌트 */}
              <CalendarSection
                currentDate={currentDate}
                calendarCells={calendarCells}
                selectedDateStr={selectedDateStr}
                onSelectDate={setSelectedDateStr}
                eventsByDate={eventsByDate}
                todayStr={todayStr}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                onUpdateEventDate={handleUpdateEventDate}
                onRefreshCalendar={handleRefreshCalendar}
                isRefreshing={isRefreshing}
              />

              {/* 우측 (4열 배정): 선택 일정 타임라인 및 몰입 할일 목록 */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* 1. 격리 추출된 선택 날짜의 구체적 일정 타임라인 컴포넌트 */}
                <TimelineSection
                  formattedSelectedDate={formattedSelectedDate}
                  selectedDateEvents={selectedDateEvents}
                  onOpenCreateModal={openCreateEventModal}
                  onDeleteEvent={deleteCalendarEvent}
                  formatTime={formatTime}
                  onEditEvent={openEditEventModal}
                />

                {/* 2. 격리 추출된 몰입 할일 및 완료 진행율 종합 컴포넌트 */}
                <ActiveGoalSection
                  goals={filteredGoals}
                  allGoalsLength={goals.length}
                  onOpenTaskSyncModal={openTaskSyncModal}
                  onDeleteGoal={deleteGoal}
                  isLeaf={isLeaf}
                  findCurrentWorkStep={findCurrentWorkStep}
                />

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

      {/* ==================== [ 격리 추출된 구글 일정 등록 팝업 모달 컴포넌트 ] ==================== */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalTitle={modalTitle}
        setModalTitle={setModalTitle}
        modalDescription={modalDescription}
        setModalDescription={setModalDescription}
        modalDate={modalDate}
        setModalDate={setModalDate}
        modalStartTime={modalStartTime}
        setModalStartTime={setModalStartTime}
        modalEndTime={modalEndTime}
        setModalEndTime={setModalEndTime}
        modalError={modalError}
        modalLoading={modalLoading}
        onSubmit={handleCreateOrUpdateEvent}
        isEditMode={isEditMode}
        onDelete={() => {
          deleteCalendarEvent(editingEventId, modalTitle);
          setIsModalOpen(false);
        }}
      />

      {/* Mobile Nav */}
      <MobileNav />
    </div>
  );
}
