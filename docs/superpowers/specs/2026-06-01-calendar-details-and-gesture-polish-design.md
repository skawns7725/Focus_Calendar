# Calendar Details And Gesture Polish Design

## Goal

Make Focus Calendar feel familiar and dependable on mobile: use common calendar wording, prevent horizontal overflow, preserve useful details such as notes, and add restrained swipe shortcuts without hiding essential actions.

## Scope

### Familiar Event Form

The existing task form remains the single source for creation and editing. Labels change to familiar calendar wording:

- `일정 제목`
- `시간 설정`
- `자동으로 시간 찾기`
- `시작 시간 직접 선택`
- `시작`
- `마감`
- `소요 시간`
- `중요도`
- `메모`

Editing uses the same form in place instead of an ISO-string browser prompt. The form supports `일정 추가`, `변경사항 저장`, and `취소`.

### Event Notes

Each task stores an optional plain-text note and location. They are included in create and edit requests, shown as short previews on the card, and sent to a dedicated Google Calendar event description and location when two-way sync is enabled. Both remain optional and must not crowd the compact list.

### Mobile Gestures

Task cards support horizontal touch gestures on mobile:

- Swipe right far enough to complete.
- Swipe left far enough to reveal `수정` and `삭제`.
- Tapping explicit buttons remains available for accessibility and discoverability.
- Completing or revealing actions uses a brief transition and optional `navigator.vibrate(10)` when supported.
- Deleting asks for confirmation.

The existing tap-style completion control is retained as a fallback. Gestures enhance the interface but are never the only way to perform an action.

### Responsive Containment

All grid and flex descendants that contain user text use `min-width: 0`. Long titles, notes, chips, and actions wrap inside the card. Form rows shrink to the viewport. The document does not scroll horizontally at narrow widths.

### Copy Refinement

User-facing task terminology becomes neutral and familiar:

- `할 일 등록` becomes `새 일정`
- `기한 초과` becomes `마감 지남`
- `이월 N회` becomes `다음 날로 이동 N회`
- `포기` becomes `삭제`
- `새 마감 설정` becomes `일정 수정`

Internal domain names may remain unchanged to keep the implementation scoped.

### Google Calendar Return Flow

The OAuth callback redirects back to `/settings` after success. If token exchange, profile lookup, persistence, or session creation fails, the callback redirects to `/settings?google=error` instead of displaying a raw HTTP 500 page. The settings page shows a concise reconnect message. Missing callback parameters remain a `400` response because they indicate an invalid direct request.

## Data Flow

1. The user creates or edits a task through `QuestForm`.
2. `QuestDraft` includes optional `note`.
3. The task API validates and persists the note.
4. Task cards render a compact note preview.
5. Two-way Google sync maps the note to the event description.
6. Mobile gesture handlers invoke the same complete, edit, and delete callbacks as visible buttons.

## Error Handling

- Notes are trimmed and limited to 2,000 characters.
- Delete requires confirmation in the browser.
- OAuth failures return the user to settings with a reconnect prompt.
- Gestures ignore short drags so vertical scrolling remains comfortable.

## Verification

- Unit tests cover note persistence through the service, form labels and draft payload, Google event description, gesture thresholds, and OAuth callback fallback.
- CSS is checked for horizontal containment.
- Production build must pass.
- A 390-pixel browser viewport verifies no horizontal overflow, card wrapping, the edit form, and the Google reconnect prompt.
