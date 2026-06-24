"use client";

import { ReactNode, useEffect } from "react";
import { initPostHog } from "@/client/analytics";

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return children;
}
