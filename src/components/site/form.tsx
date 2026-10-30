"use client";
import { useId } from "react";

export const inputCls = (err?: string) =>
  `h-[46px] w-full min-w-0 rounded-ctl border bg-field px-3.5 text-[16px] font-normal ${err ? "border-error" : "border-line-field"}`;
export const textareaCls = (err?: string) =>
  `w-full min-w-0 resize-y rounded-ctl border bg-field px-3.5 py-3 text-[16px] font-normal ${err ? "border-error" : "border-line-field"}`;

type FieldProps = {
  label: React.ReactNode;
  err?: string;
  extra?: React.ReactNode;
  children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** 欄位：label + 控制項 + 紅字錯誤（README §8：錯誤欄位邊框 #B3261E）。 */
export function Field({ label, err, extra, children }: FieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-[13px] font-medium">
      <label htmlFor={id} className="flex justify-between gap-2">
        <span>{label}</span>
        {extra}
      </label>
      {children({ id, "aria-invalid": !!err, "aria-describedby": err ? errId : undefined })}
      {err ? (
        <span id={errId} className="font-normal text-error">
          {err}
        </span>
      ) : null}
    </div>
  );
}

export function FormErrorSummary({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-ctl bg-error-bg px-3.5 py-2.5 text-[13px] text-error-ink">
      {children}
    </div>
  );
}

/** honeypot：真人看不到；機器人填了就丟棄 */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label>
        公司名稱（請勿填寫）
        <input tabIndex={-1} autoComplete="off" name="company" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
