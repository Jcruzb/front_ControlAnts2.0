import { useState } from "react";

export default function ListControls({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  sortValue,
  onSortChange,
  sortOptions = [],
  filterValue = "all",
  onFilterChange,
  filterOptions = [],
  resultsCount,
  totalCount,
  onClearFilters,
  hasActiveFilters = false,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="rounded-[30px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Exploración
            </p>
            <p className="mt-1 text-sm text-slate-400">
              <span className="font-semibold text-white">{resultsCount}</span>
              {" / "}
              {totalCount} resultados
              {hasActiveFilters ? " filtrados" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-white/[0.06] hover:text-blue-200"
              >
                Limpiar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
              aria-expanded={expanded}
            >
              {expanded ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>
        </div>

        {expanded ? (
          <>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
              <label className="block">
                <span className="sr-only">Buscar</span>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                />
              </label>

              <label className="block">
                <span className="sr-only">Ordenar</span>
                <select
                  value={sortValue}
                  onChange={(event) => onSortChange(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/50"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filterOptions.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filterOptions.map((option) => {
                  const active = option.value === filterValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onFilterChange?.(option.value)}
                      className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "border-blue-400/30 bg-blue-500/12 text-blue-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
