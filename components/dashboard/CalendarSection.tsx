"use client";

import React, { useState } from "react";
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
  onUpdateEventDate?: (eventId: string, targetDateStr: string) => void;
  onRefreshCalendar?: () => void;
  isRefreshing?: boolean;
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
  onUpdateEventDate,
  onRefreshCalendar,
  isRefreshing = false,
}: CalendarSectionProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  return (
    <div className="lg:col-span-8 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 pl-1">
        
        {/* 달력 제목 구글 이동 링킹 숏컷 장착 - 토스 블루 컬러 리터칭 */}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-headline-sm text-base md:text-lg font-bold text-[#191f28] dark:text-neutral-100 flex items-center gap-2 group hover:text-[#00C896] transition-colors cursor-pointer"
          title="구글 캘린더 새 창에서 열기"
        >
          <span className="material-symbols-outlined text-[#00C896] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          <span>구글 캘린더 달력</span>
          <span className="material-symbols-outlined text-[#8b95a1] text-xs md:text-sm group-hover:text-[#00C896] transition-colors">open_in_new</span>
        </a>
        
        {/* 달력 컨트롤러 */}
        <div className="flex items-center gap-2">
          {/* 구글 캘린더 동기화 새로고침 */}
          {onRefreshCalendar && (
            <button
              onClick={onRefreshCalendar}
              disabled={isRefreshing}
              className="p-1 md:p-1.5 bg-primary border-none text-white hover:bg-primary/95 rounded-lg md:rounded-xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-60 shadow-sm"
              title="구글 캘린더와 즉시 동기화"
              type="button"
            >
              <span className={`material-symbols-outlined text-sm md:text-base text-white ${isRefreshing ? "animate-spin" : ""}`}>
                autorenew
              </span>
            </button>
          )}

          <button
            onClick={onToday}
            className="px-2.5 py-1 md:px-3.5 md:py-1.5 bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 text-[#4e5968] dark:text-neutral-300 text-[10px] md:text-xs font-bold rounded-lg md:rounded-xl hover:bg-[#f2f4f6] dark:hover:bg-neutral-700 hover:text-[#191f28] dark:hover:text-white transition-all shadow-sm"
            type="button"
          >
            오늘
          </button>
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-[#edf1f5] dark:border-neutral-700 rounded-lg md:rounded-xl px-1 md:px-1.5 py-0.5 shadow-sm">
            <button
              onClick={onPrevMonth}
              className="p-1 text-[#8b95a1] hover:text-[#00C896] transition-colors flex items-center justify-center"
              aria-label="이전 달"
              type="button"
            >
              <span className="material-symbols-outlined text-sm md:text-base">chevron_left</span>
            </button>
            <span className="text-[10px] md:text-xs font-bold text-[#191f28] dark:text-[#f5f5f7] px-1 md:px-2.5 min-w-[70px] md:min-w-[80px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 text-[#8b95a1] hover:text-[#00C896] transition-colors flex items-center justify-center"
              aria-label="다음 달"
              type="button"
            >
              <span className="material-symbols-outlined text-sm md:text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 실제 달력 그리드 카드 - 토스 화이트 플레이트 스타일 적용 */}
      <div className="glass-card p-2.5 md:p-6 rounded-2xl md:rounded-3xl border border-[#edf1f5] dark:border-neutral-700/50 shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-center font-bold text-[10px] md:text-xs text-[#8b95a1] mb-2 md:mb-4">
          <div className="text-[#ff4b4b] dark:text-red-400 py-1">일</div>
          <div className="py-1">월</div>
          <div className="py-1">화</div>
          <div className="py-1">수</div>
          <div className="py-1">목</div>
          <div className="py-1">금</div>
          <div className="text-[#3182f6] dark:text-sky-400 py-1">토</div>
        </div>

        {/* 42칸 날짜 셀 격자 */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarCells.map(({ dateStr, day, isCurrentMonth }) => {
            const dayEvents = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const isDragOver = dragOverDate === dateStr;
            
            const dayOfWeek = new Date(dateStr).getDay();

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                onDragOver={(e) => {
                  if (onUpdateEventDate) {
                    e.preventDefault();
                    if (dragOverDate !== dateStr) {
                      setDragOverDate(dateStr);
                    }
                  }
                }}
                onDragLeave={() => {
                  if (dragOverDate === dateStr) {
                    setDragOverDate(null);
                  }
                }}
                onDrop={(e) => {
                  if (onUpdateEventDate) {
                    e.preventDefault();
                    const eventId = e.dataTransfer.getData("text/plain");
                    if (eventId) {
                      onUpdateEventDate(eventId, dateStr);
                    }
                    setDragOverDate(null);
                  }
                }}
                className={`min-h-[50px] sm:min-h-[65px] md:min-h-[95px] p-1 md:p-2 rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                  isDragOver
                    ? "bg-[#e0fdf4]/60 dark:bg-[#003d2a]/40 border-[#00C896] border-dashed ring-2 ring-[#00C896]/20"
                    : isSelected
                      ? "bg-[#e0fdf4] dark:bg-[#003d2a]/40 border-[#00C896] ring-1 ring-[#00C896]"
                      : isToday
                        ? "bg-[#f0fdf9] dark:bg-[#003d2a]/20 border-[#6ff0cf] dark:border-[#00C896]/30"
                        : isCurrentMonth
                          ? "bg-white dark:bg-neutral-800 border-[#edf1f5] dark:border-neutral-700/60 hover:border-[#00C896]/40"
                          : "bg-transparent border-transparent opacity-35 hover:opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-[10px] md:text-xs font-bold leading-none w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shrink-0 ${
                      isToday
                        ? "bg-[#00C896] text-white shadow-sm"
                        : dayOfWeek === 0
                          ? "text-[#ff4b4b] dark:text-red-400"
                          : dayOfWeek === 6
                            ? "text-[#3182f6] dark:text-sky-400"
                            : "text-[#191f28] dark:text-[#f5f5f7]"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] md:text-[9px] font-bold text-[#00C896] bg-[#e0fdf4] dark:bg-[#003d2a]/50 px-1 md:px-1.5 py-0.2 md:py-0.5 rounded-full shrink-0">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 md:gap-1 mt-1 md:mt-2 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={event.id}
                      title={event.title}
                      draggable="true"
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/plain", event.id);
                      }}
                      className={`text-[8px] md:text-[10px] font-bold bg-[#e0fdf4] dark:bg-[#003d2a]/50 text-[#00C896] dark:text-[#6ff0cf] truncate px-1 md:px-2 py-0.5 rounded-md md:rounded-lg border-none line-clamp-1 cursor-grab active:cursor-grabbing hover:bg-[#ccf7ed] dark:hover:bg-[#003d2a]/80 transition-colors ${
                        idx === 1 ? "hidden md:block" : ""
                      }`}
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
