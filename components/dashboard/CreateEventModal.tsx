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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
      {/* 프리미엄 화이트 글래스모피즘 본체 카드 */}
      <div className="bg-white/90 dark:bg-surface-container-high/90 backdrop-blur-xl p-6 md:p-8 rounded-[28px] w-full max-w-md border border-white/40 dark:border-white/10 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* 깨끗한 화이트 데코레이션 블롭 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-neutral-100/20 dark:bg-neutral-800/10 rounded-full blur-xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4 mb-6 relative z-10">
          <h3 className="font-headline-sm text-lg md:text-xl font-bold text-on-surface flex items-center gap-2.5">
            <span className="material-symbols-outlined text-on-surface text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_add_on
            </span>
            구글 캘린더에 일정 등록
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-neutral-100 dark:hover:bg-surface-container-low transition-all p-1.5 rounded-full duration-200 flex items-center justify-center"
            aria-label="닫기"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="space-y-5 relative z-10">
          
          {/* 일정 제목 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline tracking-wider uppercase pl-0.5">
              일정 제목
            </label>
            <input
              type="text"
              required
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              placeholder="예: 프로젝트 마일스톤 회의"
              className="w-full px-4 h-12 bg-white/70 dark:bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 focus:border-neutral-400 dark:focus:border-neutral-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 text-sm text-on-surface font-semibold placeholder:text-outline/40 transition-all duration-200"
            />
          </div>

          {/* 일정 설명 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline tracking-wider uppercase pl-0.5">
              상세 설명 (메모)
            </label>
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              placeholder="회의 안건 및 준비물을 입력하세요."
              className="w-full p-4 min-h-24 resize-none bg-white/70 dark:bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 focus:border-neutral-400 dark:focus:border-neutral-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 text-xs text-on-surface leading-relaxed placeholder:text-outline/40 transition-all duration-200"
            />
          </div>

          {/* 날짜 선택 (단독 행 배치) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-outline tracking-wider uppercase pl-0.5">
              날짜
            </label>
            <input
              type="date"
              required
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              className="w-full px-4 h-12 bg-white/70 dark:bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 focus:border-neutral-400 dark:focus:border-neutral-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 text-xs font-medium text-on-surface transition-all duration-200"
            />
          </div>

          {/* 시간 설정 (날짜 아래 행 배치) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-outline tracking-wider uppercase pl-0.5">
                시작 시간
              </label>
              <input
                type="time"
                required
                value={modalStartTime}
                onChange={(e) => setModalStartTime(e.target.value)}
                className="w-full px-4 h-12 bg-white/70 dark:bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 focus:border-neutral-400 dark:focus:border-neutral-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 text-xs font-medium text-on-surface transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-outline tracking-wider uppercase pl-0.5">
                종료 시간
              </label>
              <input
                type="time"
                required
                value={modalEndTime}
                onChange={(e) => setModalEndTime(e.target.value)}
                className="w-full px-4 h-12 bg-white/70 dark:bg-surface-container/40 backdrop-blur-sm border border-outline-variant/30 focus:border-neutral-400 dark:focus:border-neutral-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-700 text-xs font-medium text-on-surface transition-all duration-200"
              />
            </div>
          </div>

          {modalError && (
            <p className="rounded-2xl bg-error-container/15 border border-error/20 px-4 py-3 text-xs text-error font-semibold animate-fade-in">
              {modalError}
            </p>
          )}

          {/* 등록 버튼 */}
          <div className="flex gap-3 border-t border-outline-variant/15 pt-5 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-neutral-100/50 dark:bg-surface-container/50 border border-outline-variant/30 hover:bg-neutral-200/50 dark:hover:bg-surface-container text-on-surface-variant font-bold rounded-2xl text-sm transition-all active:scale-[0.98] duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-3 bg-white dark:bg-surface-container border border-outline-variant/40 hover:bg-neutral-50 dark:hover:bg-surface-container-high text-on-surface font-bold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] duration-200"
            >
              {modalLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-on-surface border-t-transparent rounded-full mr-1.5" />
                  등록 중...
                </>
              ) : (
                "등록하기"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
