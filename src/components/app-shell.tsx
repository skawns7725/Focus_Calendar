import Link from "next/link";
import { ReactNode } from "react";
import { AccountStatus } from "./account-status";
import { BrandIcon, DayIcon, ListIcon, SettingsIcon, WeekIcon } from "./icons";

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <Link className="brand" href="/"><span className="brand-mark"><BrandIcon size={20} /></span><span>Focus Calendar</span></Link>
        <nav aria-label="데스크톱 메뉴" className="side-nav">
          <Link className="active" href="/"><ListIcon className="nav-icon" />할 일 목록</Link>
          <Link href="/calendar/day"><DayIcon className="nav-icon" />일간 캘린더</Link>
          <Link href="/calendar/week"><WeekIcon className="nav-icon" />주간 캘린더</Link>
          <Link href="/settings"><SettingsIcon className="nav-icon" />설정</Link>
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          Google Calendar 연결 준비
        </div>
        <AccountStatus />
      </aside>
      <main className="app-main">
        <header className="page-header">
          <div><p className="eyebrow">오늘 일정</p><h1>{title}</h1><p>{subtitle}</p></div>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        {children}
      </main>
      <nav aria-label="모바일 메뉴" className="mobile-nav">
        <Link className="active" href="/"><ListIcon />목록</Link>
        <Link href="/calendar/day"><DayIcon />일간</Link>
        <Link href="/calendar/week"><WeekIcon />주간</Link>
        <Link href="/settings"><SettingsIcon />설정</Link>
      </nav>
    </div>
  );
}
