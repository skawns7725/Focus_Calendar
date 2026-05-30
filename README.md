# Focus Calendar

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

## Google Cloud OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com/)에서 `Focus Calendar` 프로젝트를 생성합니다.
2. `APIs & Services`에서 `Google Calendar API`를 활성화합니다.
3. OAuth 동의 화면을 구성합니다.
4. OAuth 클라이언트 유형으로 `Web application`을 선택합니다.
5. 승인된 리디렉션 URI에 `http://localhost:3000/api/google/callback`을 추가합니다.
6. 발급된 값을 `.env`에 입력합니다.

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google/callback"
```

기본 연결은 Google Calendar 읽기 권한만 요청합니다. 사용자가 설정에서 양방향 동기화를 선택한 경우에만 쓰기 권한을 추가 요청하며, 앱이 만든 `Focus Calendar` 전용 캘린더만 수정합니다.

## Integration Boundary

Google OAuth 코드와 전용 캘린더 생성 경계는 준비되어 있습니다. 운영 환경에서는 계정별 데이터 격리, 토큰 갱신, 백그라운드 동기화, 예약 이월 작업, 브라우저 푸시 전달을 추가해야 합니다.
