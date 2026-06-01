import Link from "next/link";
import { ReactNode } from "react";
import { AccountStatus } from "./account-status";
import { AppNavigation } from "./app-navigation";
import { BrandIcon } from "./icons";
import { NotificationCenter } from "./notification-center";

export function AppShell({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <Link className="brand" href="/"><span className="brand-mark"><BrandIcon size={20} /></span><span>Focus Calendar</span></Link>
        <AppNavigation variant="desktop" />
        <div className="sidebar-note">
          <span className="status-dot" />
          Google Calendar 연결 준비
        </div>
      </aside>
      <main className="app-main">
        <div className="account-slot"><NotificationCenter /><AccountStatus /></div>
        <header className="page-header">
          <div><p className="eyebrow">오늘 일정</p><h1>{title}</h1><p>{subtitle}</p></div>
          {actions && <div className="header-actions">{actions}</div>}
        </header>
        {children}
      </main>
      <AppNavigation variant="mobile" />
    </div>
  );
}
