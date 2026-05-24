-- 시간 추정은 제품 흐름에서 제거하고, 업무 단계는 제목/설명/상태만 저장합니다.
ALTER TABLE "TaskStep" DROP COLUMN IF EXISTS "estimateMinutes";
