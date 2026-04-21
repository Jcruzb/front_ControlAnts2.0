export default function MonthNavigation({
  year,
  month,
  setYear,
  setMonth,
  monthNames,
  goPrevMonth,
  goNextMonth,
  resetToCurrentMonth,
  currentYear,
  yearRange = 5,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "grid w-full min-w-0 gap-3 sm:w-auto sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          : "grid w-full min-w-0 max-w-[760px] gap-3"
      }
    >
      <div
        className={
          compact
            ? "grid min-w-0 grid-cols-3 items-center gap-2 sm:col-span-2"
            : "grid w-full min-w-0 grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2 sm:grid-cols-[56px_minmax(0,1fr)_56px] sm:gap-3"
        }
      >
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Mes anterior"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09]"
        >
          <span aria-hidden>←</span>
        </button>

        <button
          type="button"
          onClick={resetToCurrentMonth}
          className="inline-flex h-12 w-full min-w-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-center text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.09] sm:px-5"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Mes siguiente"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.09]"
        >
          <span aria-hidden>→</span>
        </button>
      </div>

      <div
        className={
          compact
            ? "grid min-w-0 grid-cols-2 gap-3 sm:col-span-2"
            : "grid w-full min-w-0 grid-cols-2 gap-3"
        }
      >
        <select
          className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-100 sm:px-4"
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {monthNames.map((name, index) => (
            <option key={index + 1} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          className="w-full min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-slate-100 sm:px-4"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {Array.from({ length: yearRange }).map((_, index) => {
            const optionYear = currentYear - 2 + index;
            return (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
