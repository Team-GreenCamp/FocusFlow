"use client";

import React from "react";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  modalTitle: string;
  setModalTitle: (title: string) => void;
  modalDescription: string;
  setModalDescription: (desc: string) => void;
  modalDate: string;
  setModalDate: (date: string) => void;
  modalStartTime: string;
  setModalStartTime: (time: string) => void;
  modalEndTime: string;
  setModalEndTime: (time: string) => void;
  modalError: string;
  modalLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function CreateEventModal({
  isOpen,
  onClose,
  modalTitle,
  setModalTitle,
  modalDescription,
  setModalDescription,
  modalDate,
  setModalDate,
  modalStartTime,
  setModalStartTime,
  modalEndTime,
  setModalEndTime,
  modalError,
  modalLoading,
  onSubmit,
}: CreateEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div className="glass-card p-6 md:p-7 rounded-3xl w-full max-w-md border border-outline-variant/30 shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 mb-5">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_add_on</span>
            구글 캘린더에 일정 등록
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container"
            aria-label="닫기"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          
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

          {/* 등록 버튼 */}
          <div className="flex gap-3 border-t border-outline-variant/20 pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-surface-container border border-outline-variant text-on-surface-variant font-bold rounded-xl text-sm hover:bg-surface-container-high transition-all active:scale-95 duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 duration-200"
            >
              {modalLoading ? "등록 중..." : "등록"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
