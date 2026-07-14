import { useState } from "react";

export default function ListControls({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  sortValue,
  onSortChange,
  sortOptions = [],
  extraSelectValue,
  onExtraSelectChange,
  extraSelectOptions = [],
  extraSelectLabel = "Filtro",
  secondarySelectValue,
  onSecondarySelectChange,
  secondarySelectOptions = [],
  secondarySelectLabel = "Filtro",
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
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[30px] border border-white/15 bg-[#0d1117] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.26)] sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/12 bg-[#11161d] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-full border border-blue-300/35 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
              >
                Limpiar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="rounded-full border border-white/20 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/60"
              aria-expanded={expanded}
            >
              {expanded ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>
        </div>

        {expanded ? (
          <>
            <div
              className={`grid min-w-0 gap-3 lg:items-center ${
                extraSelectOptions.length > 0 || secondarySelectOptions.length > 0
                  ? secondarySelectOptions.length > 0
                    ? "lg:grid-cols-[minmax(0,1fr)_200px_200px_200px]"
                    : "lg:grid-cols-[minmax(0,1fr)_220px_220px]"
                  : "lg:grid-cols-[minmax(0,1fr)_220px]"
              }`}
            >
              <label className="block min-w-0">
                <span className="sr-only">Buscar</span>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full min-w-0 rounded-2xl border border-white/20 bg-[#070a0f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 hover:border-white/30 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25"
                />
              </label>

              <label className="block min-w-0">
                <span className="sr-only">Ordenar</span>
                <select
                  value={sortValue}
                  onChange={(event) => onSortChange(event.target.value)}
                  className="w-full min-w-0 rounded-2xl border border-white/20 bg-[#070a0f] px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] hover:border-white/30 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {extraSelectOptions.length > 0 ? (
                <label className="block min-w-0">
                  <span className="sr-only">{extraSelectLabel}</span>
                  <select
                    value={extraSelectValue}
                    onChange={(event) => onExtraSelectChange?.(event.target.value)}
                    className="w-full min-w-0 rounded-2xl border border-white/20 bg-[#070a0f] px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] hover:border-white/30 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25"
                  >
                    {extraSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {secondarySelectOptions.length > 0 ? (
                <label className="block min-w-0">
                  <span className="sr-only">{secondarySelectLabel}</span>
                  <select
                    value={secondarySelectValue}
                    onChange={(event) => onSecondarySelectChange?.(event.target.value)}
                    className="w-full min-w-0 rounded-2xl border border-white/20 bg-[#070a0f] px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] hover:border-white/30 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25"
                  >
                    {secondarySelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {filterOptions.length > 0 ? (
              <div className="flex max-w-full flex-wrap gap-2 pb-1">
                {filterOptions.map((option) => {
                  const active = option.value === filterValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onFilterChange?.(option.value)}
                      className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "border-blue-300/60 bg-blue-500/25 text-white shadow-[0_0_0_1px_rgba(147,197,253,0.08)]"
                          : "border-white/15 bg-white/[0.05] text-slate-200 hover:border-white/25 hover:bg-white/[0.1]"
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
