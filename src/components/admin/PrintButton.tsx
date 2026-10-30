"use client";

import { useState } from "react";

/** 等字型載入完成再列印，避免列印時字型尚未就緒而跑版。 */
export default function PrintButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="adm-btn adm-btn--primary adm-btn--sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await document.fonts?.ready;
        } catch {
          /* ignore */
        }
        setBusy(false);
        window.print();
      }}
    >
      🖨 列印
    </button>
  );
}
