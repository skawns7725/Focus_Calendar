"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/client/api";
import { AppShell } from "./app-shell";

interface Settings {
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  defaultView: "list" | "day" | "week";
  timeZone: string;
}

const defaults: Settings = {
  weekdayStart: "09:00", weekdayEnd: "22:00", weekendStart: "10:00", weekendEnd: "22:00", defaultView: "list", timeZone: "Asia/Seoul"
};

export function SettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getSettings().then(setSettings).catch(() => setSettings(defaults)); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell title="설정" subtitle="자동 배치가 사용할 시간 범위를 정하세요.">
      <form className="settings-card" onSubmit={submit}>
        <div><p className="eyebrow">Available Hours</p><h2>활동 가능 시간</h2><p>퀘스트는 이 시간 안의 빈 공간에만 배치됩니다.</p></div>
        <div className="settings-grid">
          <label>평일 시작<input type="time" value={settings.weekdayStart} onChange={(event) => setSettings({ ...settings, weekdayStart: event.target.value })} /></label>
          <label>평일 종료<input type="time" value={settings.weekdayEnd} onChange={(event) => setSettings({ ...settings, weekdayEnd: event.target.value })} /></label>
          <label>주말 시작<input type="time" value={settings.weekendStart} onChange={(event) => setSettings({ ...settings, weekendStart: event.target.value })} /></label>
          <label>주말 종료<input type="time" value={settings.weekendEnd} onChange={(event) => setSettings({ ...settings, weekendEnd: event.target.value })} /></label>
          <label>기본 시작 화면<select value={settings.defaultView} onChange={(event) => setSettings({ ...settings, defaultView: event.target.value as Settings["defaultView"] })}><option value="list">퀘스트 목록</option><option value="day">일간 캘린더</option><option value="week">주간 캘린더</option></select></label>
        </div>
        <button className="primary-button" type="submit">설정 저장</button>
        {saved && <p className="saved-message" role="status">설정을 저장했습니다.</p>}
      </form>
    </AppShell>
  );
}

