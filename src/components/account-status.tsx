"use client";

import { useEffect, useState } from "react";
import { getAuthStatus, signOut } from "@/client/api";

interface AuthStatus {
  signedIn: boolean;
  localDevelopment: boolean;
  email: string | null;
}

export function AccountStatus() {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    getAuthStatus().then(setStatus).catch(() => setStatus({ signedIn: false, localDevelopment: false, email: null }));
  }, []);

  async function logOut() {
    await signOut();
    setStatus({ signedIn: false, localDevelopment: false, email: null });
  }

  if (!status) return null;
  if (status.localDevelopment) return <div className="sidebar-note">로컬 개발 모드</div>;
  if (!status.signedIn) return <a className="secondary-button" href="/api/google/connect?mode=read">Google로 로그인</a>;
  return <div className="sidebar-note"><span>{status.email}</span><button className="secondary-button" type="button" onClick={() => void logOut()}>로그아웃</button></div>;
}
