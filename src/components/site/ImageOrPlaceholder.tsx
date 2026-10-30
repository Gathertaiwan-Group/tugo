import Image from "next/image";
import { bg } from "@/lib/site/format";

type Props = {
  src?: string | null;
  hue: number;
  angle?: number;
  L?: number;
  /** 佔位標籤（說明此處應放什麼圖）；為空則不顯示 */
  label?: string;
  labelPos?: "bl" | "tl" | "tr" | "br";
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** true：純裝飾，不輸出 role=img */
  decorative?: boolean;
  children?: React.ReactNode;
};

const POS = { bl: "left-2.5 bottom-2.5", tl: "left-2.5 top-2.5", tr: "right-2.5 top-2.5", br: "right-2.5 bottom-2.5" };

/** README §4.6：有 url 用 next/image，否則顯示條紋佔位 + Mono 標籤。外層需自行給尺寸 / aspect-ratio。 */
export function ImageOrPlaceholder({ src, hue, angle = 135, L = 0.87, label, labelPos = "bl", alt, sizes = "100vw", className = "", priority, decorative, children }: Props) {
  // 呼叫端給 absolute 時不要再加 relative（兩者同時存在時 relative 會贏，元素高度變 0）
  const pos = /(^|\s)(absolute|fixed)(\s|$)/.test(className) ? "" : "relative";
  if (src) {
    return (
      <div className={`${pos} overflow-hidden ${className}`}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
        {children}
      </div>
    );
  }
  return (
    <div
      className={`${pos} overflow-hidden ${className}`}
      style={{ background: bg(hue, angle, L) }}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": alt })}
    >
      {label ? (
        <span className={`absolute ${POS[labelPos]} max-w-[calc(100%-20px)] rounded-chip bg-[rgba(244,239,229,.92)] px-[7px] py-1 font-mono text-[10px] font-medium leading-[1.3] tracking-[.04em] text-ink`}>
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}
