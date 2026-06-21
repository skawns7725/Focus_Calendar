# Focus Calendar Review Log

이 문서는 최근 검증 상태와 남은 리스크를 기록한다.
새 작업을 시작하기 전에 `AGENTS.md`와 함께 확인한다.

---

## 2026-06-22 — Study Plan Scheduler and PostgreSQL Migration Stabilization

상태: 커밋 준비 완료

### 변경 요약

- 시험일, 과목, 범위, 진도율, 난이도, 하루 공부 가능 시간을 바탕으로 StudyPlan과 StudyBlock 생성
- StudyBlock 완료 상태 저장 및 ownerId 격리 적용
- 완료된 StudyBlock을 schedule candidate에서 제외하되 기존 자동 배치 흐름에는 연결하지 않음
- 첫 delta 직전 전체 스키마를 생성하는 baseline migration 추가
- 기존 quest scheduling 및 study plan migration은 delta로 유지
- 모바일 대시보드에서 `now-panel`을 Study Plan Scheduler 위로 이동
- Google sync category 변환은 내부 Quest DTO 호환 범위로 유지

### 주요 변경 파일

- `prisma/migrations/20260621180000_baseline/migration.sql`
- `prisma/migrations/20260621190000_add_quest_scheduling_fields/migration.sql`
- `prisma/migrations/20260622120000_add_study_plan_scheduler/migration.sql`
- `prisma/schema.prisma`
- `src/domain/study-plan.ts`
- `src/server/study-plan-repository.ts`
- `src/server/study-plan-repository.integration.test.ts`
- `src/server/services/study-plan-service.ts`
- `src/app/api/study-plans/route.ts`
- `src/app/api/study-blocks/[id]/complete/route.ts`
- `src/components/study-plan-scheduler.tsx`
- `src/components/dashboard.tsx`
- `e2e/mobile-flow.spec.ts`

### PostgreSQL 검증 결과

- disposable PostgreSQL 16 컨테이너에서 빈 DB migration chain 적용 성공
  1. `20260621180000_baseline`
  2. `20260621190000_add_quest_scheduling_fields`
  3. `20260622120000_add_study_plan_scheduler`
- `npx prisma validate` 통과
- `npx prisma migrate status`: database schema up to date
- 적용 후 Prisma schema drift 없음
- 기존 DB 모사 검증에서 baseline을 `resolve --applied`한 뒤 두 delta 적용 성공
- legacy Quest의 `expectedMinutes=45`, `importance=3` 보존
- 기존 Quest의 `category=other` backfill 확인
- 신규 Quest의 `expectedMinutes=30`, `importance=2`, `category=other` 기본값 확인

### 테스트 및 빌드 결과

- StudyPlan PostgreSQL repository 통합 테스트 4개 통과
  - StudyPlan과 StudyBlock 동시 저장
  - ownerId별 목록 격리
  - 다른 owner의 block 완료 차단 및 자기 block 완료 상태 저장
  - completed StudyBlock의 schedule candidate 제외
  - StudyPlan 삭제 시 StudyBlock DB cascade
- 오늘 집중 블록, 자동 배치, 미배치, StudyPlan, Google focused 테스트 62개 통과
- Google 관련 테스트 25개 통과
- PostgreSQL 전체 테스트 143개 통과, 실패 0개, skipped 0개
- 모바일 390px E2E 1개 통과 및 수평 overflow 없음
- `npm run build` 통과
- `git diff --check` 통과

### 실패 또는 미실행 항목

- 실패한 검증 없음
- 운영 DB migration 적용 및 배포는 실행하지 않음

### 남은 리스크

- migration 이력이 없는 기존 DB에는 baseline SQL을 직접 실행하지 말고 실제 스키마를 확인한 뒤 `prisma migrate resolve --applied` 전략을 사용해야 함
- pre-delta DB는 baseline만 applied 처리한 뒤 두 delta를 적용해야 함
- 이미 최종 스키마인 DB는 검증 후 세 migration을 모두 applied 처리해야 함
- PostgreSQL 테스트와 CI는 PostgreSQL 형식의 `DATABASE_URL`을 프로세스 환경변수로 제공해야 함

### 다음 단계

- 의도된 파일만 선별 staging 후 커밋
- 배포 전 대상 DB의 실제 schema와 `_prisma_migrations` 이력을 확인하고 baseline 처리 전략을 확정

---

## 2026-06-21 — Today Focus Scheduling Stabilization

상태: 커밋 전 검증 후보

### 변경 요약

- 오늘의 집중 블록을 메인 헤더 바로 아래 최상단으로 이동
- 집중 블록에 시간, 제목, 카테고리, 상태, 완료 버튼 표시
- 빈 화면 문구와 첫 할 일 추가 버튼 적용
- 일간 캘린더에 할 일 없음, 시간 부족, 정상 배치 상태 문구 적용
- “배치하지 못한 할 일” 영역 추가
- 소요 시간, 중요도, 카테고리 기본값 유지
- Google Calendar 동기화 및 알림 동작은 변경하지 않음

### 자동 배치 기준

- 미완료·미배치 유동 할 일만 대상
- 마감일 오름차순
- 중요도 내림차순
- 설정된 활동 가능 시간과 현재 시각 이후에 배치
- 기존 일정 사이 빈 공간 사용
- 예상 소요 시간만큼 블록 생성
- 블록 사이 10분 확보
- 활동 종료 시각을 넘으면 미배치 처리

### 주요 변경 파일

- `src/domain/auto-schedule-today.ts`
- `src/server/services/scheduling-service.ts`
- `src/components/today-focus-blocks.tsx`
- `src/components/dashboard.tsx`
- `src/components/calendar-page.tsx`
- `src/components/quest-form.tsx`
- `src/app/globals.css`
- `src/domain/types.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260621190000_add_quest_scheduling_fields/migration.sql`
- `src/domain/auto-schedule-today.test.ts`
- `e2e/mobile-flow.spec.ts`

### 검증 결과

- Prisma migration 추가
  - 기존 행의 `category`는 `other`로 채움
  - `expectedMinutes=30`, `importance=2` 기본값 적용
- 자동 배치 경계 테스트 7개 통과
  - 빈 목록
  - 50분 할 일
  - 중요도 정렬
  - 시간 부족
  - 일정 사이 빈 공간
  - 활동 시간 이후
  - 기타 경계 상황
- 완료 클릭 즉시 반영 테스트 추가
- 완료 실패 시 복구 테스트 추가
- 새로고침 후 완료 상태 유지 테스트 추가
- 모바일 390px 폭 초과 E2E 검증 추가
- `npx prisma validate` 통과
- 프로덕션 빌드 성공
- `git diff --check` 통과
- 전체 테스트 120개 중 114개 통과
- 이번 변경 관련 테스트 23개 통과

### 남은 리스크

- 실패한 전체 테스트 6개는 로컬 `.env`의 SQLite URL과 PostgreSQL 스키마 불일치로 인한 기존 환경 문제로 판단됨
- 해당 6개 실패가 이번 변경과 무관한지 커밋 전 최종 확인 필요
- 실제 모바일 브라우저 검증은 로컬 개발 서버 응답 지연으로 완료하지 못함
- 배포 전 Google Calendar 회귀 확인 필요

### 추천 커밋 메시지

```text
feat: stabilize today focus scheduling before deployment
```

---

## Review Entry Template

새 검증 기록은 아래 형식을 사용한다.

```md
## YYYY-MM-DD — 작업명

상태:

### 변경 요약

-

### 주요 변경 파일

-

### 검증 결과

-

### 실패 또는 미실행 항목

-

### 남은 리스크

-

### 다음 단계

-
```
