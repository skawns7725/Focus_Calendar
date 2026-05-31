"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DayIcon, ListIcon, SettingsIcon, WeekIcon } from "./icons";

const items = [
  { href: "/", label: "할 일 목록", mobileLabel: "목록", icon: ListIcon },
  { href: "/calendar/day", label: "일간 캘린더", mobileLabel: "일간", icon: DayIcon },
  { href: "/calendar/week", label: "주간 캘린더", mobileLabel: "주간", icon: WeekIcon },
  { href: "/settings", label: "설정", mobileLabel: "설정", icon: SettingsIcon }
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

export function AppNavigation() {
  const pathname = usePathname() ?? "/";

  return (
    <>
      <nav aria-label="데스크톱 메뉴" className="side-nav">
        {items.map(({ href, icon: Icon, label }) => <Link className={isCurrent(pathname, href) ? "active" : undefined} href={href} key={href}><Icon className="nav-icon" />{label}</Link>)}
      </nav>
      <nav aria-label="모바일 메뉴" className="mobile-nav">
        {items.map(({ href, icon: Icon, label, mobileLabel }) => <Link aria-label={label} className={isCurrent(pathname, href) ? "active" : undefined} href={href} key={href}><Icon />{mobileLabel}</Link>)}
      </nav>
    </>
  );
}
