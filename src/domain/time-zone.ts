export function toLocalDate(instant: Date, timeZone: string): string {
  const parts = localParts(instant, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function toInstant(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let guess = target;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const parts = localParts(new Date(guess), timeZone);
    const rendered = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const difference = target - rendered;
    if (difference === 0) return new Date(guess);
    guess += difference;
  }

  return new Date(guess);
}

export function addLocalDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function localWeekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function localParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(instant);

  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}
