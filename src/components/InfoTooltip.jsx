import { useEffect, useId, useRef, useState } from "react";

export default function InfoTooltip({ label = "Ver información", children }) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleOtherTooltipOpen = (event) => {
      if (event.detail !== tooltipId) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("info-tooltip-open", handleOtherTooltipOpen);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("info-tooltip-open", handleOtherTooltipOpen);
    };
  }, [isOpen, tooltipId]);

  const toggleTooltip = () => {
    setIsOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        window.dispatchEvent(
          new CustomEvent("info-tooltip-open", { detail: tooltipId })
        );
      }

      return nextOpen;
    });
  };

  return (
    <span ref={rootRef} className="group relative inline-flex">
      <button
        type="button"
        className="peer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-semibold normal-case tracking-normal text-slate-300 outline-none transition hover:border-blue-300/30 hover:text-white focus:border-blue-300/40 focus:text-white"
        aria-label={label}
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        onClick={toggleTooltip}
      >
        i
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none fixed inset-x-3 bottom-4 z-[60] rounded-2xl border border-white/10 bg-[#111823] px-3 py-2 text-left text-xs normal-case leading-relaxed tracking-normal text-slate-200 opacity-0 shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition md:absolute md:bottom-auto md:left-0 md:right-auto md:top-7 md:w-[min(72vw,260px)] md:group-hover:opacity-100 md:peer-focus:opacity-100 ${
          isOpen ? "opacity-100" : ""
        }`}
      >
        {children}
      </span>
    </span>
  );
}
