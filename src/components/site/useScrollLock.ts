"use client";
import { useEffect } from "react";

/** 開啟時鎖背景捲動，並在按 Esc 時呼叫 onClose。 */
export function useScrollLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevH = html.style.overflow;
    const prevB = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prevH;
      document.body.style.overflow = prevB;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}
