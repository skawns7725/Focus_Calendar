"use client";

import { FormEvent, useEffect, useState } from "react";
import { getGoogleStatus, getSettings, listGoogleCalendars, syncGoogleCalendar, updateSettings } from "@/client/api";
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
  googleImportMode: "all" | "selected" | null;
  selectedGoogleCalendarIds: string[];
}

interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  dedicatedCalendarId: string | null;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

interface GoogleCalendar {
  id: string;
  summary: string;
}

const defaults: Settings = {
  weekdayStart: "09:00", weekdayEnd: "22:00", weekendStart: "10:00", weekendEnd: "22:00",
  defaultView: "list", timeZone: "Asia/Seoul", theme: "light", twoWaySync: false,
  googleImportMode: null, selectedGoogleCalendarIds: []
};

export function SettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [google, setGoogle] = useState<GoogleStatus>({ configured: false, connected: false, dedicatedCalendarId: null });
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => setSettings(defaults));
    getGoogleStatus().then(async (status: GoogleStatus) => {
      setGoogle(status);
      if (status.connected) setCalendars(await listGoogleCalendars());
    }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateSettings(settings);
    saveTheme(settings.theme);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await syncGoogleCalendar();
      setGoogle(await getGoogleStatus());
    } finally {
      setSyncing(false);
    }
  }

  function toggleCalendar(id: string) {
    const selected = settings.selectedGoogleCalendarIds.includes(id)
      ? settings.selectedGoogleCalendarIds.filter((calendarId) => calendarId !== id)
      : [...settings.selectedGoogleCalendarIds, id];
    setSettings({ ...settings, selectedGoogleCalendarIds: selected });
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

        {google.connected && <section>
          <p className="eyebrow">가져올 캘린더</p>
          <h2>일정 가져오기 범위</h2>
          {!settings.googleImportMode && <p className="form-error">처음 동기화하기 전에 가져올 캘린더 범위를 선택하세요.</p>}
          <label><input type="radio" name="googleImportMode" checked={settings.googleImportMode === "all"} onChange={() => setSettings({ ...settings, googleImportMode: "all" })} />모든 캘린더</label>
          <label><input type="radio" name="googleImportMode" checked={settings.googleImportMode === "selected"} onChange={() => setSettings({ ...settings, googleImportMode: "selected" })} />선택한 캘린더만</label>
          <div className="settings-grid">
            {calendars.map((calendar) => <label key={calendar.id}><input type="checkbox" checked={settings.selectedGoogleCalendarIds.includes(calendar.id)} onChange={() => toggleCalendar(calendar.id)} />{calendar.summary}</label>)}
          </div>
        </section>}

        <button className="primary-button" type="submit">설정 저장</button>
        {saved && <p className="saved-message" role="status">설정을 저장했습니다.</p>}
      </form>

      <section className="settings-card">
        <div><p className="eyebrow">Google Calendar</p><h2>캘린더 연결</h2><p>기본 연결은 일정 가져오기만 허용합니다. 양방향 동기화는 직접 켠 경우에만 추가 권한을 요청합니다.</p></div>
        {!google.configured && <p className="form-error">Google Cloud OAuth 설정이 필요합니다.</p>}
        {google.connected ? <p className="saved-message">Google Calendar가 연결되어 있습니다.</p> : <a className="secondary-button" href="/api/google/connect?mode=read">읽기 전용으로 연결</a>}
        {google.connected && !google.dedicatedCalendarId && <a className="secondary-button" href="/api/google/connect?mode=write">양방향 동기화 권한 요청</a>}
        {google.dedicatedCalendarId && <p className="saved-message">전용 Focus Calendar와 양방향 동기화가 준비되었습니다.</p>}
        {google.connected && <button className="secondary-button" type="button" disabled={syncing || !settings.googleImportMode} onClick={() => void syncNow()}>{syncing ? "동기화 중..." : "지금 동기화"}</button>}
        {google.lastSyncedAt && <p>마지막 동기화: {new Date(google.lastSyncedAt).toLocaleString()}</p>}
        {google.lastSyncError && <p className="form-error">동기화 오류: {google.lastSyncError}</p>}
      </section>
    </AppShell>
  );
}
