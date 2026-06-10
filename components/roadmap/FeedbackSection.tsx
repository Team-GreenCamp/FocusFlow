import React from 'react';

interface FeedbackSectionProps {
  memo: string;
  setMemo: (value: string) => void;
  completedLeafStepsCount: number;
  createReflection: () => void;
  loading: boolean;
  reflection: { markdown: string } | null;
}

export default function FeedbackSection({
  memo,
  setMemo,
  completedLeafStepsCount,
  createReflection,
  loading,
  reflection,
}: FeedbackSectionProps) {
  return (
    <div className="glass-card p-6 rounded-xl transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-primary">rate_review</span>
        <div>
          <h3 className="font-headline-md text-headline-md text-text-primary">업무 회고와 종료 피드백</h3>
          <p className="font-body-md text-body-md text-text-secondary">
            완료한 구체 업무와 짧은 메모를 합쳐 다음 작업에 쓸 피드백으로 정리합니다.
          </p>
        </div>
      </div>
      <textarea
        className="w-full min-h-28 resize-none rounded-lg border border-border-color bg-surface-color/70 p-4 font-body-md text-body-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
        value={memo}
        onChange={(event) => setMemo(event.target.value)}
        placeholder="팁: 오늘 업무를 진행하며 느낀 점, 아쉬웠던 부분, 또는 다음에 다르게 시도해볼 행동 개선안을 자유롭게 남겨보세요."
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary font-medium">
          현재 피드백 재료: 완료 업무 {completedLeafStepsCount}개
        </p>
        <button
          onClick={createReflection}
          disabled={loading || !memo.trim()}
          className="px-5 py-2.5 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          type="button"
        >
          {loading ? "피드백 생성 중..." : "회고 피드백 생성"}
        </button>
      </div>
      {reflection && (
        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-inverse-surface p-4 font-code text-code text-inverse-on-surface">
          {reflection.markdown}
        </pre>
      )}
    </div>
  );
}
