"use client";
import { useId, useState } from "react";

/** 手風琴：一次只開一個（README §5.7）。 */
export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(-1);
  const base = useId();
  return (
    <div className="border-t border-ink">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-line">
            <h2 className="m-0 text-[17px] font-medium">
              <button
                type="button"
                id={`${base}-q${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`${base}-a${i}`}
                className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-5 text-left text-[17px] font-medium"
              >
                {f.question}
                <span aria-hidden="true" className="font-mono text-[22px] font-normal leading-none text-forest">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h2>
            {isOpen ? (
              <p id={`${base}-a${i}`} role="region" aria-labelledby={`${base}-q${i}`} className="m-0 mb-5 animate-tugo-in text-[15px] text-body2">
                {f.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
