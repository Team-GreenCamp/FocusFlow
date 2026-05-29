-- Prisma Account 모델과 실제 DB 컬럼을 맞춰 Google 계정 조회 오류를 방지합니다.
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "refresh_token_expires_in" INTEGER;
