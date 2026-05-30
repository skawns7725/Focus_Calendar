"use client";

import { FormEvent, useEffect, useState } from "react";
import { getGoogleStatus, getSettings, updateSettings } from "@/client/api";
import { AppShell } from "./app-shell";
import { saveTheme, ThemeChoice } from "./theme-controller";

interface Settings {
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  defaultView: "list" | "day" | "week";
  timeZone: string;
  theme: ThemeChoice;
  twoWaySync: boolean;
}

const defaults: Settings = {
  weekdayStart: "09:00", weekdayEnd: "22:00", weekendStart: "10:00", weekendEnd: "22:00", defaultView: "list", timeZone: "Asia/Seoul", theme: "light", twoWaySync: false
};

export function SettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [google, setGoogle] = useState({ configured: false, connected: false, dedicatedCalendarId: null as string | null });

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(defaults));
    getGoogleStatus().then(setGoogle).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateSettings(settings);
    saveTheme(settings.theme);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell title="설정" subtitle="자동 배치가 사용할 시간 범위를 정하세요.">
      <form className="settings-card" onSubmit={submit}>
        <div><p className="eyebrow">활동 시간</p><h2>활동 가능 시간</h2><p>할 일은 이 시간 안의 빈 공간에만 배치됩니다.</p></div>
        <div className="settings-grid">
          <label>평일 시작<input type="time" value={settings.weekdayStart} onChange={(event) => setSettings({ ...settings, weekdayStart: event.target.value })} /></label>
          <label>평일 종료<input type="time" value={settings.weekdayEnd} onChange={(event) => setSettings({ ...settings, weekdayEnd: event.target.value })} /></label>
          <label>주말 시작<input type="time" value={settings.weekendStart} onChange={(event) => setSettings({ ...settings, weekendStart: event.target.value })} /></label>
          <label>주말 종료<input type="time" value={settings.weekendEnd} onChange={(event) => setSettings({ ...settings, weekendEnd: event.target.value })} /></label>
          <label>기본 시작 화면<select value={settings.defaultView} onChange={(event) => setSettings({ ...settings, defaultView: event.target.value as Settings["defaultView"] })}><option value="list">할 일 목록</option><option value="day">일간 캘린더</option><option value="week">주간 캘린더</option></select></label>
          <label>테마<select value={settings.theme} onChange={(event) => setSettings({ ...settings, theme: event.target.value as ThemeChoice })}><option value="light">라이트</option><option value="dark">다크</option><option value="system">시스템 설정 따르기</option></select></label>
        </div>
        <button className="primary-button" type="submit">설정 저장</button>
        {saved && <p className="saved-message" role="status">설정을 저장했습니다.</p>}
      </form>
      <section className="settings-card">
        <div><p className="eyebrow">Google Calendar</p><h2>캘린더 연결</h2><p>기본 연결은 일정 가져오기만 허용합니다. 양방향 동기화는 직접 켠 경우에만 추가 권한을 요청합니다.</p></div>
        {!google.configured && <p className="form-error">Google Cloud OAuth 설정이 필요합니다.</p>}
        {google.connected ? <p className="saved-message">Google Calendar가 연결되어 있습니다.</p> : <a className="secondary-button" href="/api/google/connect?mode=read">읽기 전용으로 연결</a>}
        {google.connected && !google.dedicatedCalendarId && <a className="secondary-button" href="/api/google/connect?mode=write">양방향 동기화 권한 요청</a>}
        {google.dedicatedCalendarId && <p className="saved-message">전용 Focus Calendar 캘린더와 양방향 동기화가 준비되었습니다.</p>}
      </section>
    </AppShell>
  );
}
