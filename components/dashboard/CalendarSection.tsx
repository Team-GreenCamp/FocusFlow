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
}: CalendarSectionProps) {
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
    </div>
  );
}
