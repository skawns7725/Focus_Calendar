import { ChevronRightIcon } from "./icons";

export function SlideToComplete({ onComplete }: { onComplete(): void }) {
  return <button aria-label="밀어서 완료" className="slide-complete" type="button" onClick={onComplete}><span><ChevronRightIcon size={15} /></span>밀어서 완료</button>;
}
