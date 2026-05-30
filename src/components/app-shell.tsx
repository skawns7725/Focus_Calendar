import Link from "next/link";
import { ReactNode } from "react";

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <Link className="brand" href="/"><span className="brand-mark">Q</span><span>Quest Calendar</span></Link>
        <nav aria-label="데스크톱 메뉴" className="side-nav">
          <Link className="active" href="/">퀘스트 목록</Link>
          <Link href="/calendar/day">일간 캘린더</Link>
          <Link href="/calendar/week">주간 캘린더</Link>
          <Link href="/settings">설정</Link>
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          Google Calendar 읽기 전용
        </div>
      </aside>
      <main className="app-main">
        <header className="page-header">
          <div><p className="eyebrow">오늘의 작전</p><h1>{title}</h1><p>{subtitle}</p></div>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        {children}
      </main>
      <nav aria-label="모바일 메뉴" className="mobile-nav">
        <Link className="active" href="/"><span>☰</span>목록</Link>
        <Link href="/calendar/day"><span>◷</span>일간</Link>
        <Link href="/calendar/week"><span>▦</span>주간</Link>
        <Link href="/settings"><span>⚙</span>설정</Link>
      </nav>
    </div>
  );
}

