"use client";

import React from "react";
import type { CalendarEventSummary } from "@/lib/google-calendar";

type CalendarCell = {
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
};

type CalendarSectionProps = {
  currentDate: Date;
  calendarCells: CalendarCell[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  eventsByDate: Record<string, CalendarEventSummary[]>;
  todayStr: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onOpenCreateModal?: () => void;
  onDeleteEvent?: (eventId: string, eventTitle: string) => void;
  formatTime?: (isoString: string | null, allDay: boolean) => string;
};

export default function CalendarSection({
  currentDate,
  calendarCells,
  selectedDateStr,
  onSelectDate,
  eventsByDate,
  todayStr,
  onPrevMonth,
  onNextMonth,
  onToday,
  onOpenCreateModal,
  onDeleteEvent,
  formatTime,
}: CalendarSectionProps) {
  // 요일 텍스트를 한글로 변환하는 헬퍼 함수
  const getKoreanDayOfWeek = (dateStr: string) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayIndex = new Date(dateStr).getDay();
    return days[dayIndex];
  };

  // 날짜 형식화 텍스트 생성 (예: 5월 29일 (금))
  const getFormattedDateText = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${getKoreanDayOfWeek(dateStr)})`;
  };

  // 모바일 뷰용: 이번 달 날짜 중에서 일정이 있거나 오늘이거나 현재 선택된 날만 필터링
  const activeDateCells = calendarCells.filter((cell) => {
    if (!cell.isCurrentMonth) return false;
    const dayEvents = eventsByDate[cell.dateStr] ?? [];
    const isToday = cell.dateStr === todayStr;
    const isSelected = cell.dateStr === selectedDateStr;
    return dayEvents.length > 0 || isToday || isSelected;
  });

  return (
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
            onClick={onToday}
            className="px-3 py-1 bg-surface-container-high/60 border border-outline-variant/30 text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container transition-all"
            type="button"
          >
            오늘
          </button>
          <div className="flex items-center bg-surface-container-low/40 rounded-lg border border-outline-variant/30 px-1 py-0.5">
            <button
              onClick={onPrevMonth}
              className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              aria-label="이전 달"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-on-surface px-2.5 min-w-[75px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
              aria-label="다음 달"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 데스크톱 달력 그리드 카드 (md 이상 화면) */}
      <div className="hidden md:block glass-card p-5 rounded-3xl border border-outline-variant/20 shadow-md">
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
                onClick={() => onSelectDate(dateStr)}
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

      {/* 모바일 간략화 캘린더 뷰 (md 미만 화면) */}
      <div className="block md:hidden flex flex-col gap-2">
        {activeDateCells.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center flex flex-col items-center justify-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-outline/50 text-4xl mb-2">calendar_today</span>
            <p className="text-on-surface-variant text-sm font-medium">이번 달에는 등록된 일정이 없습니다.</p>
            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="mt-4 px-4 py-2 bg-primary text-white font-bold rounded-xl shadow text-xs hover:bg-primary/95 transition-all"
                type="button"
              >
                첫 일정 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeDateCells.map((cell) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;
              const dayEvents = eventsByDate[cell.dateStr] ?? [];
              const dayOfWeek = new Date(cell.dateStr).getDay();
              const dateText = getFormattedDateText(cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  className={`glass-card border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? "border-primary/50 ring-1 ring-primary/30 shadow-md bg-primary/5"
                      : isToday
                      ? "border-secondary/40 bg-secondary/5"
                      : "border-outline-variant/10 bg-surface-container-lowest/10 hover:border-primary/20"
                  }`}
                >
                  {/* 요약 헤더 (클릭 시 토글) */}
                  <div
                    onClick={() => onSelectDate(cell.dateStr)}
                    className="flex items-center justify-between p-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-sm font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-secondary text-on-secondary shadow-sm"
                            : dayOfWeek === 0
                            ? "text-error"
                            : dayOfWeek === 6
                            ? "text-primary"
                            : "text-on-surface"
                        }`}
                      >
                        {cell.day}
                      </span>
                      <span className="text-sm font-bold text-on-surface">{dateText}</span>
                      {isToday && (
                        <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-0.5 rounded-full">
                          오늘
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {dayEvents.length > 0 ? (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                          {dayEvents.length}개
                        </span>
                      ) : (
                        <span className="text-[11px] text-outline font-medium">일정 없음</span>
                      )}
                      <span
                        className={`material-symbols-outlined text-outline transition-transform duration-200 ${
                          isSelected ? "rotate-180 text-primary" : ""
                        }`}
                      >
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>

                  {/* 클릭 시 노출될 상세 정보 (아코디언) */}
                  {isSelected && (
                    <div className="border-t border-outline-variant/15 bg-surface-container-lowest/30 p-4 flex flex-col gap-3">
                      {dayEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                          <span className="material-symbols-outlined text-outline/50 text-2xl mb-1.5">calendar_today</span>
                          <p className="text-on-surface-variant text-[11px] leading-relaxed">
                            등록된 구글 캘린더 일정이 없습니다.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-0.5">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/15 hover:border-primary/20 transition-all flex flex-col gap-1"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="font-bold text-xs text-on-surface line-clamp-1">{event.title}</h5>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {formatTime && (
                                    <span className="text-[9px] font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                      {formatTime(event.start, event.allDay)}
                                    </span>
                                  )}
                                  {onDeleteEvent && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteEvent(event.id, event.title);
                                      }}
                                      className="text-on-surface-variant hover:text-error transition-colors p-0.5 rounded hover:bg-surface-container flex items-center justify-center"
                                      title="일정 삭제"
                                      type="button"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              {event.location && (
                                <div className="text-[9px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[9px]">location_on</span>
                                  {event.location}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 일정 추가 버튼 */}
                      {onOpenCreateModal && (
                        <div className="border-t border-outline-variant/10 pt-3 mt-1 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenCreateModal();
                            }}
                            className="text-primary font-bold text-xs flex items-center gap-0.5 hover:underline"
                            type="button"
                          >
                            이 날짜에 새 일정 등록
                            <span className="material-symbols-outlined text-[14px] font-bold">add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
