import { Link } from "react-router-dom";

export default function MobilePrimaryAction({
  to,
  label = "Añadir gasto",
}) {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div className="mx-auto flex w-full max-w-[1600px] justify-end px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] pb-[calc(var(--safe-bottom)+1rem)] sm:px-[max(1.5rem,var(--safe-left))] sm:pr-[max(1.5rem,var(--safe-right))]">
          <Link
            to={to}
            aria-label={label}
            title={label}
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-blue-500 text-3xl font-medium text-white shadow-[0_20px_45px_rgba(0,0,0,0.4)] transition hover:bg-blue-400"
          >
            +
          </Link>
        </div>
      </div>
    </>
  );
}
