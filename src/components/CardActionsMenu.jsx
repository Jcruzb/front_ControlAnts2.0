import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function getActionToneClasses(tone) {
  switch (tone) {
    case "danger":
      return {
        mobile:
          "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/14",
        desktop: "text-red-300 hover:bg-red-500/10",
      };
    case "success":
      return {
        mobile:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/14",
        desktop: "text-emerald-300 hover:bg-emerald-500/10",
      };
    default:
      return {
        mobile:
          "border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]",
        desktop: "text-slate-200 hover:bg-white/[0.06]",
      };
  }
}

export default function CardActionsMenu({
  title,
  subtitle = null,
  actions = [],
  buttonLabel = "Abrir opciones",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 639px)").matches;
  });
  const actionsRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen && !isMobileViewport) {
      document.addEventListener("pointerdown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen, isMobileViewport]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const handleActionSelect = (action) => {
    closeMenu();
    action.onSelect();
  };

  const mobileSheet =
    isOpen && isMobileViewport
      ? createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:hidden"
            role="presentation"
            onClick={closeMenu}
          >
            <div
              className="w-full rounded-[28px] border border-white/10 bg-[#11161d] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
              role="menu"
              aria-label={`Acciones para ${title}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/8 px-2 pb-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{title}</p>
                  {subtitle ? (
                    <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeMenu();
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Cerrar acciones"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                {actions.map((action) => {
                  const toneClasses = getActionToneClasses(action.tone);

                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleActionSelect(action);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${toneClasses.mobile}`}
                      role="menuitem"
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="relative shrink-0" ref={actionsRef}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen((value) => !value);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          aria-label={buttonLabel}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          ⋯
        </button>

        {isOpen && !isMobileViewport ? (
          <div
            className="absolute right-0 top-full z-[70] mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#11161d] shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
            role="menu"
          >
            {actions.map((action) => {
              const toneClasses = getActionToneClasses(action.tone);

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleActionSelect(action);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition ${toneClasses.desktop}`}
                  role="menuitem"
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {mobileSheet}
    </>
  );
}
