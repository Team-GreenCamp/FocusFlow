# FocusFlow

AI 기반 지능형 업무 관리 서비스 MVP입니다. 추상적인 업무를 Vertex AI Gemini로 구체적인 실행 단계로 분해하고, 완료한 업무를 바탕으로 회고와 피드백을 생성합니다.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Google Cloud Vertex AI Gemini (`@google/genai`)

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

`AI_MOCK_MODE="true"`이면 Vertex 인증 없이 개발용 응답으로 UI와 DB 흐름을 확인할 수 있습니다. 실제 Vertex AI를 사용할 때는 `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_GENAI_USE_VERTEXAI`, `VERTEX_MODEL`을 설정하고 `AI_MOCK_MODE`를 `false`로 바꾸세요.

## Google OAuth / Calendar

Google Cloud OAuth 클라이언트의 승인된 리디렉션 URI에 아래 값을 추가하세요.

```text
http://localhost:3001/api/auth/callback/google
```

`.env`에는 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`이 필요합니다. Calendar API 일정 읽기는 로그인 시 `calendar.readonly` 권한을 요청합니다. 이미 로그인한 상태에서 권한을 추가했다면 로그아웃 후 다시 Google 로그인을 진행해야 새 캘린더 권한이 세션에 반영됩니다.
