"use client";

import React from "react";
import type { CalendarEventSummary } from "@/lib/google-calendar";

type TimelineSectionProps = {
  formattedSelectedDate: string;
  selectedDateEvents: CalendarEventSummary[];
  onOpenCreateModal: () => void;
  onDeleteEvent: (eventId: string, eventTitle: string) => void;
  formatTime: (isoString: string | null, allDay: boolean) => string;
};

export default function TimelineSection({
  formattedSelectedDate,
  selectedDateEvents,
  onOpenCreateModal,
  onDeleteEvent,
  formatTime,
}: TimelineSectionProps) {
  return (
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
                      onClick={() => onDeleteEvent(event.id, event.title)}
                      className="text-on-surface-variant hover:text-error transition-colors p-0.5 rounded hover:bg-surface-container flex items-center justify-center"
                      title="이 일정 구글 캘린더에서 삭제"
                      type="button"
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
            onClick={onOpenCreateModal}
            className="text-primary font-bold flex items-center gap-0.5 hover:underline"
            type="button"
          >
            내 캘린더에 일정 등록
            <span className="material-symbols-outlined text-[12px] font-bold">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
