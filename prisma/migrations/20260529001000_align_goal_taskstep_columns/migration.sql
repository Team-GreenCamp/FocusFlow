-- 현재 Prisma 스키마가 기대하는 Goal/TaskStep 컬럼을 실제 DB에 맞춥니다.
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT;

ALTER TABLE "TaskStep" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT;
ALTER TABLE "TaskStep" ADD COLUMN IF NOT EXISTS "estimateMinutes" INTEGER;

-- 기존 행이 있어도 NOT NULL 제약을 걸 수 있도록 기본값을 채웁니다.
UPDATE "TaskStep"
SET "estimateMinutes" = 1
WHERE "estimateMinutes" IS NULL;

ALTER TABLE "TaskStep" ALTER COLUMN "estimateMinutes" SET NOT NULL;
