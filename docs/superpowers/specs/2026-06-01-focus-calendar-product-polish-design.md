# Focus Calendar Product Polish Design

## Product Identity

Focus Calendar is a calm priority guide. Its defining interaction is not browsing a large task inventory. It is seeing the single next action that matters, while keeping the full ordered list available below it.

The visual language stays monochrome and restrained: generous whitespace, black and white surfaces, thin borders, compact line icons, and a muted red reserved for overdue items. The interface should feel deliberate rather than decorative.

## Scope

### Now Panel

The dashboard shows a prominent "지금 할 일" panel above the ordered list. It contains the highest-priority unfinished task, its timing context, and a direct completion action. When no tasks remain, it becomes a calm onboarding message with a direct add-task action.

### Real Calendar Data

The day and week pages stop rendering demo data. They load imported Google Calendar blocks and scheduled quests for the visible date range, combine them, sort them by start time, and display a useful loading or error state.

### Navigation Accuracy

Desktop and mobile navigation indicate the current route. This gives the responsive web app the clarity expected from an installed mobile shortcut.

### Copy And Mobile Finish

The dashboard uses concise, ordinary language. The mobile completion affordance and empty states use the same minimal icon system and avoid game-like language.

## Verification

- Component tests cover current-route navigation, the now panel, and real calendar loading.
- Existing component tests continue to pass.
- `npm run build` succeeds.
- Public deployment is checked after Git author metadata is aligned with the connected GitHub account.
