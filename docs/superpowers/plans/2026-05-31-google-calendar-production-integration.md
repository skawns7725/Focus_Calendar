# Google Calendar Production Integration Plan

## Goal

로컬 MVP의 도메인 규칙과 UI를 유지하면서 계정별 Google Calendar 읽기 전용 연동과 운영 환경 자동 이월을 추가합니다.

## Tasks

1. Google OAuth 로그인과 Calendar 읽기 전용 scope를 설정합니다.
2. `LocalCalendarSource`와 같은 계약을 구현하는 `GoogleCalendarSource`를 추가합니다.
3. 퀘스트, 설정, 알림, 캘린더 블록을 Google 계정별로 분리합니다.
4. 사용자의 설정 시간대를 기준으로 날짜 경계 이월 작업을 예약 실행합니다.
5. 브라우저 알림 구독 정보를 저장하고 운영 환경에서 전달합니다.
6. Google Calendar 동기화 실패 시 마지막 정상 블록을 유지하고 마지막 성공 시각을 표시합니다.
7. 계정 간 데이터 격리, 반복 일정 import, 동기화 실패 복구, 예약 작업을 통합 테스트합니다.

## Constraint

Google Calendar에는 쓰기 권한을 요청하지 않습니다. 퀘스트 배치 결과는 Quest Calendar 내부에만 저장합니다.

