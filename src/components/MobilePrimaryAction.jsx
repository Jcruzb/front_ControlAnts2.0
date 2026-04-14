import { Link } from "react-router-dom";

export default function MobilePrimaryAction({
  to,
  label = "Añadir gasto",
}) {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden">
        <div className="mx-auto flex max-w-[1600px] justify-end px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6">
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
