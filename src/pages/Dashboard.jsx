import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage, unwrapCollectionResponse } from "../services/api";
import MonthNavigation from "../components/MonthNavigation";
import QuickAddIncome from "../components/QuickAddIncome";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import MobilePrimaryAction from "../components/MobilePrimaryAction";

const CATEGORY_COLORS = [
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#ef4444",
  "#eab308",
  "#14b8a6",
];

function hashString(value) {
  const text = String(value || "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getFallbackColor(value) {
  return CATEGORY_COLORS[hashString(value) % CATEGORY_COLORS.length];
}

function getCategoryMeta(item) {
  const category = item?.category_detail ?? {};
  return {
    name: category.name || item?.category_name || "Sin categoría",
    color: category.color || getFallbackColor(category.name || item?.category || item?.id),
    icon: category.icon || "•",
  };
}

function parseDateParts(value) {
  if (!value) return null;

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function ChartShell({ title, description, children, className = "" }) {
  return (
    <article
      className={`rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {children}
    </article>
  );
}

function ExpensePieChart({ items, totalExpenses }) {
  if (!items.length || totalExpenses <= 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
        No hay gastos suficientes para construir la distribución por categorías.
      </div>
    );
  }

  const stops = [];
  let cursor = 0;
  items.forEach((item) => {
    const percent = (item.total / totalExpenses) * 100;
    stops.push(`${item.color} ${cursor}% ${cursor + percent}%`);
    cursor += percent;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto flex w-full max-w-[240px] items-center justify-center">
        <div
          className="relative flex h-56 w-56 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${stops.join(", ")})`,
          }}
        >
          <div className="flex h-[62%] w-[62%] flex-col items-center justify-center rounded-full border border-white/10 bg-[#0b1117] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Gasto</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{items.length} categorías</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.slice(0, 6).map((item) => {
          const share = (item.total / totalExpenses) * 100;

          return (
            <div
              key={item.name}
              className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {share.toFixed(1)}% del gasto del mes
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-white">
                  {formatCurrency(item.total)}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${share}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyExpenseBars({ days, maxAmount }) {
  if (!days.length || maxAmount <= 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
        No hay gastos diarios para mostrar todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-end gap-2">
        {days.map((day) => {
          const height = Math.max(8, (day.total / maxAmount) * 180);

          return (
            <div key={day.day} className="flex w-10 flex-col items-center gap-2">
              <div className="flex h-[210px] w-full items-end justify-center">
                <div
                  className="w-7 rounded-t-2xl bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-[0_12px_24px_rgba(16,185,129,0.2)]"
                  style={{ height: `${height}px` }}
                  title={`${day.day}: ${formatCurrency(day.total)}`}
                />
              </div>
              <p className="text-[11px] text-slate-500">{day.day}</p>
              <p className="text-[10px] text-slate-300">{formatCurrency(day.total)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlowComparison({ income, expenses, balance }) {
  const reference = Math.max(income, expenses, Math.abs(balance), 1);

  const rows = [
    { label: "Ingresos", value: income, color: "#34d399" },
    { label: "Gastos", value: expenses, color: "#60a5fa" },
    { label: "Balance", value: Math.abs(balance), color: balance >= 0 ? "#4ade80" : "#f87171" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/8 bg-black/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Saldo neto</p>
            <p className={`mt-1 text-3xl font-semibold tracking-tight ${balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {balance >= 0 ? "+" : ""}
              {formatCurrency(balance)}
            </p>
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-medium ${balance >= 0 ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
            {balance >= 0 ? "Positivo" : "Negativo"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const width = Math.max(6, (row.value / reference) * 100);
          return (
            <div key={row.label} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{row.label}</p>
                <p className="text-sm font-semibold text-slate-100">
                  {formatCurrency(row.value)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${width}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    currentYear,
    goNextMonth,
    goPrevMonth,
    month,
    monthLabel,
    monthNames,
    resetToCurrentMonth,
    setMonth,
    setYear,
    year,
  } = useBudgetMonth();

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [expensesResponse, incomesResponse] = await Promise.all([
          api.get("/expenses/", { params: { year, month } }),
          api.get("/incomes/", { params: { year, month } }),
        ]);

        const normalizedExpenses = unwrapCollectionResponse(expensesResponse);
        const normalizedIncomes = unwrapCollectionResponse(incomesResponse);

        const expensesTotal = normalizedExpenses.reduce(
          (sum, expense) => sum + Number(expense.amount || 0),
          0
        );

        const incomesTotal = normalizedIncomes.reduce(
          (sum, income) => sum + Number(income.amount || 0),
          0
        );

        setExpenses(normalizedExpenses);
        setTotalExpenses(expensesTotal);
        setTotalIncome(incomesTotal);
        setRecentIncomes(
          [...normalizedIncomes]
            .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
            .slice(0, 4)
        );
      } catch (err) {
        console.log(err);
        setError(getApiErrorMessage(err, "No se pudo cargar el resumen del mes"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  const balance = totalIncome - totalExpenses;
  const balancePositive = balance >= 0;

  const expenseCategories = useMemo(() => {
    const grouped = new Map();

    for (const expense of expenses) {
      const meta = getCategoryMeta(expense);
      const key = meta.name;
      const current = grouped.get(key) || {
        name: meta.name,
        color: meta.color,
        icon: meta.icon,
        total: 0,
        count: 0,
      };

      current.total += Number(expense.amount || 0);
      current.count += 1;
      grouped.set(key, current);
    }

    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [expenses]);

  const dailyExpenses = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const series = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      total: 0,
    }));

    for (const expense of expenses) {
      const parts = parseDateParts(expense.date);
      if (!parts || parts.year !== year || parts.month !== month) continue;

      const target = series[parts.day - 1];
      if (target) {
        target.total += Number(expense.amount || 0);
      }
    }

    return series;
  }, [expenses, month, year]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 text-center text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        Cargando resumen del mes…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white capitalize">
            {monthLabel}
          </h1>
          <p className="text-sm text-slate-400">Resumen financiero del mes</p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
          <div className="mx-auto flex w-full justify-center">
            <MonthNavigation
              year={year}
              month={month}
              setYear={setYear}
              setMonth={setMonth}
              monthNames={monthNames}
              goPrevMonth={goPrevMonth}
              goNextMonth={goNextMonth}
              resetToCurrentMonth={resetToCurrentMonth}
              currentYear={currentYear}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Ingresos</p>
            <span className="text-xl text-emerald-300">↗</span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            + {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Gastos</p>
            <span className="text-xl text-red-300">↘</span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            − {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Balance</p>
            <span className={`text-xl ${balancePositive ? "text-emerald-300" : "text-red-300"}`}>
              {balancePositive ? "↥" : "↧"}
            </span>
          </div>
          <p
            className={`mt-4 text-3xl font-semibold tracking-tight ${
              balancePositive ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {balancePositive ? "+" : ""}
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-5">
        <ChartShell
          title="Distribución del gasto"
          description="Gráfica de torta con las categorías que más pesan en el mes."
          className="xl:col-span-2"
        >
          <ExpensePieChart items={expenseCategories} totalExpenses={totalExpenses} />
        </ChartShell>

        <ChartShell
          title="Gasto por día"
          description="Barra diaria para detectar picos de gasto dentro del mes."
          className="xl:col-span-3"
        >
          <DailyExpenseBars
            days={dailyExpenses}
            maxAmount={Math.max(...dailyExpenses.map((day) => day.total), 0)}
          />
        </ChartShell>

        <ChartShell
          title="Flujo del mes"
          description="Comparativa rápida entre ingresos, gastos y saldo final."
          className="xl:col-span-5"
        >
          <FlowComparison income={totalIncome} expenses={totalExpenses} balance={balance} />
        </ChartShell>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Ingresos recientes
              </h2>
              <p className="text-sm text-slate-400">
                Últimos movimientos del mes seleccionado
              </p>
            </div>
            <button
              onClick={() => navigate("/incomes")}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
            >
              Ver todos
            </button>
          </div>

          {recentIncomes.length === 0 ? (
            <p className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
              No hay ingresos registrados este mes.
            </p>
          ) : (
            <div className="space-y-3">
              {recentIncomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between gap-4 rounded-[28px] border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-white">
                      {income.category_detail?.name || "Ingreso"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {income.description || income.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-300">
                      + {Number(income.amount).toFixed(2)} €
                    </p>
                    <p className="text-xs text-slate-500">{income.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Claves del gasto
            </h2>
            <p className="text-sm text-slate-400">
              Categorías con más peso en el mes actual
            </p>
          </div>

          {expenseCategories.length === 0 ? (
            <p className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
              No hay gastos para analizar este mes.
            </p>
          ) : (
            <div className="space-y-3">
              {expenseCategories.slice(0, 5).map((item) => {
                const share = totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;

                return (
                  <div
                    key={item.name}
                    className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.count} movimiento{item.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, share)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => navigate("/expenses/new")}
          className="hidden items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 md:inline-flex"
        >
          ➕ Añadir gasto
        </button>
        <QuickAddIncome
          year={year}
          month={month}
          onCreated={async () => {
            setLoading(true);
            setError(null);
            try {
              const [expensesResponse, incomesResponse] = await Promise.all([
                api.get("/expenses/", { params: { year, month } }),
                api.get("/incomes/", { params: { year, month } }),
              ]);

              const normalizedExpenses = unwrapCollectionResponse(expensesResponse);
              const normalizedIncomes = unwrapCollectionResponse(incomesResponse);

              setExpenses(normalizedExpenses);
              setTotalExpenses(
                normalizedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
              );
              setTotalIncome(
                normalizedIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0)
              );
              setRecentIncomes(
                [...normalizedIncomes]
                  .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
                  .slice(0, 4)
              );
            } catch (err) {
              console.error(err);
              setError(getApiErrorMessage(err, "No se pudo cargar el resumen del mes"));
            } finally {
              setLoading(false);
            }
          }}
          buttonLabel="➕ Añadir ingreso"
          buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
        />
      </div>

      <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
    </section>
  );
};

export default Dashboard;
