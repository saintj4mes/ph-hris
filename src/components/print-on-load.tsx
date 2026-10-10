"use client";

import { useEffect } from "react";

export function PrintOnLoad() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("print") !== "1") return;
    const timeout = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
