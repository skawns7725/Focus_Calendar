# Quest Calendar

마감 기한, 중요도, 이월 횟수를 기준으로 지금 해야 할 일을 정렬하는 일정 관리 웹 앱입니다. PC 웹과 모바일 웹은 같은 URL과 데이터를 사용하지만 화면 크기에 맞는 별도 레이아웃을 제공합니다.

## Local Setup

1. `.env.example`을 `.env`로 복사합니다.
2. `npm install`을 실행합니다.
3. `npm run db:generate`를 실행합니다.
4. `npm run db:push`를 실행합니다.
5. `npm run dev`를 실행합니다.
6. 브라우저에서 `http://localhost:3000`을 엽니다.

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

## MVP Boundary

현재 버전은 로컬 SQLite 데이터베이스와 읽기 전용 로컬 캘린더 어댑터를 사용합니다. 실제 Google OAuth, Google Calendar API 호출, 서버 예약 작업, 브라우저 푸시 전달은 후속 통합 범위입니다.

