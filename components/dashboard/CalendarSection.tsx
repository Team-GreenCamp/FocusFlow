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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1">
        
        {/* 달력 제목 구글 이동 링킹 숏컷 장착 - 토스 블루 컬러 리터칭 */}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-headline-sm text-lg font-bold text-[#191f28] flex items-center gap-2 group hover:text-[#3182f6] transition-colors cursor-pointer"
          title="구글 캘린더 새 창에서 열기"
        >
          <span className="material-symbols-outlined text-[#3182f6] group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          <span>구글 캘린더 달력</span>
          <span className="material-symbols-outlined text-[#8b95a1] text-sm group-hover:text-[#3182f6] transition-colors">open_in_new</span>
        </a>
        
        {/* 달력 컨트롤러 */}
        <div className="flex items-center gap-2">
          {/* 구글 캘린더 동기화 새로고침 */}
          {onRefreshCalendar && (
            <button
              onClick={onRefreshCalendar}
              disabled={isRefreshing}
              className="p-1.5 bg-white border border-[#edf1f5] text-[#4e5968] hover:text-[#3182f6] hover:bg-[#f2f4f6] rounded-xl transition-all active:scale-95 flex items-center justify-center disabled:opacity-60 shadow-sm"
              title="구글 캘린더와 즉시 동기화"
              type="button"
            >
              <span className={`material-symbols-outlined text-base ${isRefreshing ? "animate-spin text-[#3182f6]" : ""}`}>
                autorenew
              </span>
            </button>
          )}

          <button
            onClick={onToday}
            className="px-3.5 py-1.5 bg-white border border-[#edf1f5] text-[#4e5968] text-xs font-bold rounded-xl hover:bg-[#f2f4f6] hover:text-[#191f28] transition-all shadow-sm"
            type="button"
          >
            오늘
          </button>
          <div className="flex items-center bg-white border border-[#edf1f5] rounded-xl px-1.5 py-0.5 shadow-sm">
            <button
              onClick={onPrevMonth}
              className="p-1 text-[#8b95a1] hover:text-[#3182f6] transition-colors flex items-center justify-center"
              aria-label="이전 달"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-[#191f28] px-2.5 min-w-[80px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={onNextMonth}
              className="p-1 text-[#8b95a1] hover:text-[#3182f6] transition-colors flex items-center justify-center"
              aria-label="다음 달"
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 실제 달력 그리드 카드 - 토스 화이트 플레이트 스타일 적용 */}
      <div className="glass-card p-6 rounded-3xl border border-[#edf1f5] shadow-sm">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#8b95a1] mb-4">
          <div className="text-[#ff4b4b] py-1">일</div>
          <div className="py-1">월</div>
          <div className="py-1">화</div>
          <div className="py-1">수</div>
          <div className="py-1">목</div>
          <div className="py-1">금</div>
          <div className="text-[#3182f6] py-1">토</div>
        </div>

        {/* 42칸 날짜 셀 격자 */}
        <div className="grid grid-cols-7 gap-2">
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
                className={`min-h-[75px] md:min-h-[95px] p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                  isDragOver
                    ? "bg-[#e8f3ff]/60 border-[#3182f6] border-dashed ring-2 ring-[#3182f6]/20"
                    : isSelected
                      ? "bg-[#e8f3ff] border-[#3182f6] ring-1 ring-[#3182f6]"
                      : isToday
                        ? "bg-[#edf3fc] border-[#b6cfff]"
                        : isCurrentMonth
                          ? "bg-white border-[#edf1f5] hover:border-[#3182f6]/40"
                          : "bg-transparent border-transparent opacity-35 hover:opacity-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold leading-none w-5.5 h-5.5 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-[#3182f6] text-white shadow-sm"
                        : dayOfWeek === 0
                          ? "text-[#ff4b4b]"
                          : dayOfWeek === 6
                            ? "text-[#3182f6]"
                            : "text-[#191f28]"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] font-bold text-[#3182f6] bg-[#e8f3ff] px-1.5 py-0.5 rounded-full shrink-0">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 mt-2 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      title={event.title}
                      draggable="true"
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/plain", event.id);
                      }}
                      className="text-[9px] md:text-[10px] font-bold bg-[#e8f3ff] text-[#3182f6] truncate px-2 py-0.5 rounded-lg border-none line-clamp-1 cursor-grab active:cursor-grabbing hover:bg-[#d4e9ff] transition-colors"
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
