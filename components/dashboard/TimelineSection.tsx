"use client";

import React from "react";
import type { CalendarEventSummary } from "@/lib/google-calendar";

type TimelineSectionProps = {
  formattedSelectedDate: string;
  selectedDateEvents: CalendarEventSummary[];
  onOpenCreateModal: () => void;
  onDeleteEvent: (eventId: string, eventTitle: string) => void;
  formatTime: (isoString: string | null, allDay: boolean) => string;
  onEditEvent?: (event: CalendarEventSummary) => void;
};

export default function TimelineSection({
  formattedSelectedDate,
  selectedDateEvents,
  onOpenCreateModal,
  onDeleteEvent,
  formatTime,
  onEditEvent,
}: TimelineSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-headline-sm text-base font-bold text-[#191f28] flex items-center gap-1.5 pl-1">
        <span className="material-symbols-outlined text-[#00C896] text-lg">event_available</span>
        {formattedSelectedDate}
      </h3>
      
      <div className="glass-card p-5 rounded-3xl border border-[#edf1f5] shadow-sm flex flex-col justify-between">
        {selectedDateEvents.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
            <span className="material-symbols-outlined text-[#8b95a1] text-3xl mb-2.5">calendar_today</span>
            <p className="text-[#4e5968] text-xs break-keep leading-relaxed font-semibold">
              해당 날짜에 등록된 <br />
              구글 캘린더 일정이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-0.5">
            {selectedDateEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEditEvent && onEditEvent(event)}
                className="p-3.5 rounded-2xl bg-[#f9fafb] border border-[#edf1f5] hover:border-[#00C896]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col gap-1 cursor-pointer"
                title="일정 상세 조율"
              >
                <div className="flex items-start justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#191f28] line-clamp-1">
                    {event.title}
                  </h5>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9.5px] font-bold text-[#00C896] bg-[#e0fdf4] px-2.5 py-0.5 rounded-full">
                      {formatTime(event.start, event.allDay)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event.id, event.title);
                      }}
                      className="text-[#8b95a1] hover:text-[#ff4b4b] hover:bg-[#ff4b4b]/5 transition-all p-0.5 rounded-lg flex items-center justify-center"
                      title="이 일정 구글 캘린더에서 삭제"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
                {event.location && (
                  <div className="text-[10px] text-[#4e5968] flex items-center gap-1 mt-0.5 font-medium">
                    <span className="material-symbols-outlined text-[11px] text-[#8b95a1]">location_on</span>
                    {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t border-[#edf1f5] pt-3.5 mt-4 flex justify-between items-center text-[11px]">
          <span className="text-[#8b95a1] font-bold">일정 총 {selectedDateEvents.length}개</span>
          <button
            onClick={onOpenCreateModal}
            className="text-[#00C896] hover:text-[#00a87e] font-extrabold flex items-center gap-0.5 transition-colors"
            type="button"
          >
            내 캘린더에 일정 등록
            <span className="material-symbols-outlined text-[13px] font-bold">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
