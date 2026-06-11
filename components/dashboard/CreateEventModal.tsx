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
  isEditMode?: boolean;
  onDelete?: () => void;
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
  isEditMode = false,
  onDelete,
}: CreateEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in">
      {/* 토스 스타일의 정갈하고 둥근 플레이트 팝업 카드 */}
      <div className="bg-white dark:bg-[#191f28] p-6 md:p-8 rounded-[32px] w-full max-w-md border border-[#edf1f5] dark:border-neutral-800 shadow-2xl relative overflow-hidden transition-all duration-300">
        
        {/* 깨끗한 토스 데코레이션 블롭 */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00C896]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#edf1f5] dark:border-neutral-800 pb-4 mb-6 relative z-10">
          <h3 className="font-headline-sm text-lg md:text-xl font-bold text-[#191f28] dark:text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00C896] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isEditMode ? "edit_calendar" : "calendar_add_on"}
            </span>
            {isEditMode ? "구글 캘린더 일정 수정" : "구글 캘린더에 일정 등록"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8b95a1] hover:text-[#191f28] dark:hover:text-white hover:bg-[#f2f4f6] dark:hover:bg-neutral-800 transition-all p-1.5 rounded-full duration-200 flex items-center justify-center"
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
            <label className="block text-xs font-bold text-[#8b95a1] tracking-wider uppercase pl-0.5">
              일정 제목
            </label>
            <input
              type="text"
              required
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              placeholder="예: 프로젝트 마일스톤 회의"
              className="w-full px-4 h-12 bg-[#f2f4f6] dark:bg-neutral-800 border-none focus:bg-[#edf0f2] dark:focus:bg-neutral-700/80 rounded-2xl focus:outline-none focus:ring-0 text-sm text-[#191f28] dark:text-white font-semibold placeholder-[#8b95a1] transition-all duration-200"
            />
          </div>

          {/* 일정 설명 */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#8b95a1] tracking-wider uppercase pl-0.5">
              상세 설명 (메모)
            </label>
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              placeholder="회의 안건 및 준비물을 입력하세요."
              className="w-full p-4 min-h-24 resize-none bg-[#f2f4f6] dark:bg-neutral-800 border-none focus:bg-[#edf0f2] dark:focus:bg-neutral-700/80 rounded-2xl focus:outline-none focus:ring-0 text-xs text-[#191f28] dark:text-white leading-relaxed placeholder-[#8b95a1] transition-all duration-200"
            />
          </div>

          {/* 날짜 선택 (단독 행 배치) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#8b95a1] tracking-wider uppercase pl-0.5">
              날짜
            </label>
            <input
              type="date"
              required
              value={modalDate}
              onChange={(e) => setModalDate(e.target.value)}
              className="w-full px-4 h-12 bg-[#f2f4f6] dark:bg-neutral-800 border-none focus:bg-[#edf0f2] dark:focus:bg-neutral-700/80 rounded-2xl focus:outline-none focus:ring-0 text-xs font-bold text-[#191f28] dark:text-white transition-all duration-200"
            />
          </div>

          {/* 시간 설정 (날짜 아래 행 배치) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#8b95a1] tracking-wider uppercase pl-0.5">
                시작 시간
              </label>
              <input
                type="time"
                required
                value={modalStartTime}
                onChange={(e) => setModalStartTime(e.target.value)}
                className="w-full px-4 h-12 bg-[#f2f4f6] dark:bg-neutral-800 border-none focus:bg-[#edf0f2] dark:focus:bg-neutral-700/80 rounded-2xl focus:outline-none focus:ring-0 text-xs font-bold text-[#191f28] dark:text-white transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#8b95a1] tracking-wider uppercase pl-0.5">
                종료 시간
              </label>
              <input
                type="time"
                required
                value={modalEndTime}
                onChange={(e) => setModalEndTime(e.target.value)}
                className="w-full px-4 h-12 bg-[#f2f4f6] dark:bg-neutral-800 border-none focus:bg-[#edf0f2] dark:focus:bg-neutral-700/80 rounded-2xl focus:outline-none focus:ring-0 text-xs font-bold text-[#191f28] dark:text-white transition-all duration-200"
              />
            </div>
          </div>

          {modalError && (
            <p className="rounded-2xl bg-[#ffdcdb] border border-[#ffc6c4]/40 px-4 py-3 text-xs text-[#ff4b4b] font-bold animate-fade-in">
              {modalError}
            </p>
          )}

          {/* 하단 버튼 배치 - 토스 플레이트 및 토스 블루 테마 적용 */}
          <div className="flex gap-2.5 border-t border-[#edf1f5] dark:border-neutral-800 pt-5 mt-3">
            {isEditMode && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 bg-[#ffdcdb] hover:bg-[#ffc6c4] text-[#ff4b4b] font-bold rounded-2xl text-xs transition-all active:scale-[0.98] duration-200 flex items-center justify-center gap-1 border-none"
                title="일정 삭제"
              >
                <span className="material-symbols-outlined text-sm font-bold">delete</span>
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[#f2f4f6] hover:bg-[#eef0f2] dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#4e5968] dark:text-[#b0b8c1] font-bold rounded-2xl text-sm transition-all active:scale-[0.98] duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="flex-1 px-4 py-3 bg-[#00C896] text-white font-bold rounded-2xl text-sm shadow-md hover:bg-[#00a87e] hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] duration-200 border-none"
            >
              {modalLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                  {isEditMode ? "수정 중..." : "등록 중..."}
                </>
              ) : (
                isEditMode ? "수정하기" : "등록하기"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
