"use client";

type Props = {
  qty: number;
  onDec: () => void;
  onInc: () => void;
  size?: "sm" | "md" | "lg";
  decLabel?: string;
  incLabel?: string;
};

/** 數量 −/+（1–10）。所有尺寸的按鈕觸控區 ≥44px。 */
export function QtyStepper({ qty, onDec, onInc, size = "md", decLabel = "減少數量", incLabel = "增加數量" }: Props) {
  const h = size === "lg" ? "h-[52px]" : "h-11";
  return (
    <div role="group" aria-label="數量" className={`flex items-center rounded-ctl border border-line-field bg-field ${h}`}>
      <button
        type="button"
        onClick={onDec}
        disabled={qty <= 1}
        aria-label={decLabel}
        className="h-full w-11 cursor-pointer border-0 bg-transparent text-[18px] disabled:cursor-not-allowed disabled:text-disabled"
      >
        −
      </button>
      <span aria-live="polite" className="min-w-7 text-center font-mono text-[15px] font-medium leading-none">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        disabled={qty >= 10}
        aria-label={incLabel}
        className="h-full w-11 cursor-pointer border-0 bg-transparent text-[18px] disabled:cursor-not-allowed disabled:text-disabled"
      >
        +
      </button>
    </div>
  );
}
