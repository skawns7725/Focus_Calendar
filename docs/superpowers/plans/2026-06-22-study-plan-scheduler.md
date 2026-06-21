# Study Plan Scheduler MVP 1차 Implementation Plan

> **For agentic workers:** 구현은 이 세션에서 TDD 순서로 진행한다. 사용자의 지시에 따라 커밋하지 않는다.

**Goal:** 시험 정보로 날짜별 학습 블록을 생성·표시·완료하고 자동 배치 후보 변환 경계를 제공한다.

**Architecture:** 순수 도메인 모듈이 D-day, 위험도, 블록 생성, 후보 변환을 담당한다. Prisma 저장소와 서비스가 계획 및 블록을 원자적으로 저장하고, App Router API와 재사용 가능한 대시보드 컴포넌트가 이를 사용한다.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Prisma/PostgreSQL, Zod, Vitest, Testing Library

---

### Task 1: 도메인 계약과 생성 규칙

**Files:**
- Create: `src/domain/study-plan.ts`
- Test: `src/domain/study-plan.test.ts`

- [ ] D-day와 위험도 경계 테스트를 먼저 작성하고 실패를 확인한다.
- [ ] 네 단계의 날짜별 블록 생성 테스트를 작성하고 실패를 확인한다.
- [ ] 완료 블록이 자동 배치 후보에서 제외되는 테스트를 작성하고 실패를 확인한다.
- [ ] 테스트를 통과하는 최소 순수 함수를 구현한다.

Run: `npm test -- src/domain/study-plan.test.ts`

### Task 2: Prisma 모델과 저장 서비스

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260622120000_add_study_plan_scheduler/migration.sql`
- Create: `src/server/study-plan-repository.ts`
- Create: `src/server/services/study-plan-service.ts`
- Test: `src/server/services/study-plan-service.test.ts`
- Modify: `src/server/services/user-services.ts`

- [ ] 입력 검증·저장·완료 동작의 서비스 테스트를 먼저 작성하고 실패를 확인한다.
- [ ] 신규 테이블과 안전한 외래키·인덱스를 migration에 추가한다.
- [ ] 소유자 범위를 지키는 저장소와 서비스를 최소 구현한다.

Run: `npm test -- src/server/services/study-plan-service.test.ts`

### Task 3: API와 클라이언트 경계

**Files:**
- Create: `src/app/api/study-plans/route.ts`
- Create: `src/app/api/study-blocks/[id]/complete/route.ts`
- Modify: `src/client/api.ts`

- [ ] 목록/생성과 블록 완료 Route Handler를 추가한다.
- [ ] 클라이언트 타입이 도메인 계약을 그대로 사용하도록 API 함수를 추가한다.

### Task 4: 재사용 가능한 UI

**Files:**
- Create: `src/components/study-plan-scheduler.tsx`
- Test: `src/components/study-plan-scheduler.test.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/dashboard.test.tsx`
- Modify: `src/app/globals.css`

- [ ] 폼·D-day·위험도·블록 목록·완료 UI 테스트를 먼저 작성하고 실패를 확인한다.
- [ ] 독립 컴포넌트를 최소 구현하고 대시보드에는 한 번만 조합한다.
- [ ] 저장 실패 복구와 390px 단일 열 스타일을 추가한다.

Run: `npm test -- src/components/study-plan-scheduler.test.tsx src/components/dashboard.test.tsx`

### Task 5: 순차 검증

- [ ] `npm test -- src/domain/study-plan.test.ts`
- [ ] `npm test -- src/server/services/study-plan-service.test.ts`
- [ ] `npm test -- src/components/study-plan-scheduler.test.tsx src/components/dashboard.test.tsx`
- [ ] `npx prisma validate`
- [ ] `npm run build`
- [ ] `git diff --check`
- [ ] 전체 테스트는 관련 검사와 빌드 이후 필요성을 판단해 마지막에만 실행한다.
