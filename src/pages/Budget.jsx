import { useEffect, useMemo, useState, useCallback } from "react";
import BudgetItem from "../components/BudgetItem";
import AdjustIncomePlanModal from "../components/AdjustIncomePlanModal";
import IncomePlanMonthItem from "../components/IncomePlanMonthItem";
import MonthNavigation from "../components/MonthNavigation";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import api, {
  getApiErrorMessage,
  unwrapCollectionResponse,
} from "../services/api";
import QuickAddIncome from "../components/QuickAddIncome";
import MobilePrimaryAction from "../components/MobilePrimaryAction";
import {
  adjustIncomePlan,
  confirmIncomePlan,
  getIncomePlansMonth,
} from "../services/incomePlans";

export default function Budget() {
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

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [incomes, setIncomes] = useState([]);
  const [incomesLoading, setIncomesLoading] = useState(true);
  const [incomesError, setIncomesError] = useState(null);
  const [incomePlanMonthData, setIncomePlanMonthData] = useState(null);
  const [incomePlanMonthLoading, setIncomePlanMonthLoading] = useState(true);
  const [incomePlanMonthError, setIncomePlanMonthError] = useState(null);
  const [activeIncomePlanAction, setActiveIncomePlanAction] = useState(null);
  const [adjustingPlan, setAdjustingPlan] = useState(null);
  const [adjustModalError, setAdjustModalError] = useState(null);
  const [adjustModalLoading, setAdjustModalLoading] = useState(false);

  const getIncomeCategoryName = useCallback((income) => {
    if (typeof income?.category_detail?.name === "string") {
      return income.category_detail.name;
    }

    if (typeof income?.category_name === "string") {
      return income.category_name;
    }

    if (typeof income?.category?.name === "string") {
      return income.category.name;
    }

    return "Sin categoría";
  }, []);

  const getIncomeCategoryIcon = useCallback((income) => {
    if (typeof income?.category_detail?.icon === "string") {
      return income.category_detail.icon;
    }

    if (typeof income?.category_icon === "string") {
      return income.category_icon;
    }

    if (typeof income?.category?.icon === "string") {
      return income.category.icon;
    }

    return "💰";
  }, []);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/budget/", {
        params: { year, month },
      });
      setData(res);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el presupuesto");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const fetchIncomes = useCallback(async () => {
    setIncomesLoading(true);
    setIncomesError(null);
    try {
      const res = await api.get("/incomes/", {
        params: { year, month },
      });
      setIncomes(unwrapCollectionResponse(res));
    } catch (err) {
      console.error(err);
      setIncomesError(
        getApiErrorMessage(err, "No se pudo cargar los ingresos")
      );
    } finally {
      setIncomesLoading(false);
    }
  }, [year, month]);

  const fetchIncomePlanMonth = useCallback(async () => {
    setIncomePlanMonthLoading(true);
    setIncomePlanMonthError(null);
    try {
      const response = await getIncomePlansMonth(year, month);
      setIncomePlanMonthData(response);
    } catch (err) {
      console.error(err);
      setIncomePlanMonthError(
        getApiErrorMessage(err, "No se pudieron cargar los sueldos planificados")
      );
    } finally {
      setIncomePlanMonthLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudget();
    fetchIncomes();
    fetchIncomePlanMonth();
  }, [fetchBudget, fetchIncomePlanMonth, fetchIncomes]);

  async function handleQuickAddSubmit({
    amount,
    date,
    note,
    categoryId,
    plannedExpenseId,
    recurringPaymentId,
  }) {
    const payload = {
      amount,
      date, // already resolved by the QuickAddExpense modal
      description: note || "",
      category: categoryId,
      planned_expense: plannedExpenseId,
      recurring_payment: recurringPaymentId,
    };

    console.log("[QuickAdd] Enviando gasto:", payload);

    await api.post("/expenses/", payload);
    await fetchBudget();
  }

  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
  }, [incomes]);

  const incomePlanMonthBlock = useMemo(() => {
    return data?.income_plan_month ?? incomePlanMonthData ?? null;
  }, [data?.income_plan_month, incomePlanMonthData]);

  const normalizedIncomePlanMonth = useMemo(() => {
    const source = incomePlanMonthBlock;

    if (!source || typeof source !== "object") {
      return {
        items: [],
        canResolve: true,
        isClosed: false,
      };
    }

    return {
      items: Array.isArray(source.results) ? source.results : [],
      canResolve: source.month?.is_closed !== true,
      isClosed: source.month?.is_closed === true,
      message: source.detail || source.message || null,
    };
  }, [incomePlanMonthBlock]);

  const totalSpent = data?.total_spent || 0;
  const net = totalIncome - totalSpent;

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 text-sm text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        Cargando presupuesto…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
        {error || "Error inesperado"}
      </div>
    );
  }

  const {
    status,
    remaining_amount,
    total_planned,
    planned = [],
    recurring = [],
    unplanned_total,
  } = data;

  async function refreshIncomeArea() {
    await Promise.all([fetchBudget(), fetchIncomes(), fetchIncomePlanMonth()]);
  }

  async function handleConfirmIncomePlan(item) {
    const planId = item?.plan_id;
    if (!planId) return;

    try {
      setActiveIncomePlanAction({ id: planId, type: "confirm" });
      await confirmIncomePlan(planId);
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setIncomePlanMonthError(
        getApiErrorMessage(err, "No se pudo confirmar el sueldo planificado")
      );
    } finally {
      setActiveIncomePlanAction(null);
    }
  }

  async function handleAdjustIncomePlan(payload) {
    const planId = adjustingPlan?.plan_id;
    if (!planId) return;

    try {
      setAdjustModalError(null);
      setAdjustModalLoading(true);
      await adjustIncomePlan(planId, payload);
      setAdjustingPlan(null);
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setAdjustModalError(
        getApiErrorMessage(err, "No se pudo ajustar el sueldo planificado")
      );
    } finally {
      setAdjustModalLoading(false);
    }
  }

  const statusText =
    status === "over"
      ? "Te has pasado este mes"
      : status === "warning"
      ? "Ojo, estás cerca del límite"
      : "Vas bien este mes";

  const statusColor =
    status === "over"
      ? "text-red-300"
      : status === "warning"
      ? "text-amber-300"
      : "text-emerald-300";

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="rounded-[36px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Budget mensual
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {monthLabel}
              </h1>
              <p className={`mt-3 text-sm font-medium ${statusColor}`}>
                {statusText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Ingresos
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalIncome.toFixed(0)} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Gastado
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalSpent} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Disponible
                </p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${statusColor}`}>
                  {remaining_amount} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Balance
                </p>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${
                    net >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {net.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Ingresos
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Entradas del mes
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Ingresos reales registrados y balance actual del periodo.
                </p>
              </div>
              <QuickAddIncome
                year={year}
                month={month}
                onCreated={async () => {
                  await fetchIncomes();
                  await fetchBudget();
                }}
                buttonClassName="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Total ingresos
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalIncome.toFixed(2)} €
                </p>
              </div>
              <div
                className={`rounded-[28px] border border-white/8 bg-black/20 p-4 ${
                  net < 0 ? "text-red-300" : "text-emerald-300"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Balance
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {net.toFixed(2)} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Planificado
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {total_planned} €
                </p>
              </div>
            </div>

            <div className="mt-5">
              {incomesLoading ? (
                <p className="text-sm text-slate-400">Cargando ingresos…</p>
              ) : incomesError ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {incomesError}
                </p>
              ) : incomes.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                  No hay ingresos para este mes.
                </div>
              ) : (
                <ul className="space-y-3">
                  {incomes.map((income) => (
                    <li
                      key={income.id}
                      className="flex items-center justify-between gap-4 rounded-[28px] border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-lg">
                          {getIncomeCategoryIcon(income)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {getIncomeCategoryName(income)}
                          </p>
                          {income.description && (
                            <p className="truncate text-xs text-slate-400">
                              {income.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">{income.date}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm font-semibold text-emerald-300">
                        + {parseFloat(income.amount).toFixed(2)} €
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Gastos planificados
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Control por partidas
                </h2>
              </div>
            </div>
            {planned.length > 0 && (
              <div className="space-y-3">
                {planned.map((item) => (
                  <BudgetItem
                    key={`planned-${item.id}`}
                    type="planned"
                    item={item}
                    icon="🛒"
                    onQuickAddSubmit={handleQuickAddSubmit}
                    budgetYear={year}
                    budgetMonth={month}
                  />
                ))}
              </div>
            )}
          </section>

          {recurring.length > 0 && (
            <section className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Gastos fijos
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Pagos recurrentes
                </h2>
              </div>
              <div className="space-y-3">
                {recurring.map((item) => (
                  <BudgetItem
                    key={`recurring-${item.id}`}
                    type="recurring"
                    item={item}
                    icon="🔁"
                    onQuickAddSubmit={handleQuickAddSubmit}
                    budgetYear={year}
                    budgetMonth={month}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Sueldos planificados
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Resolución mensual
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Confirma o ajusta los ingresos recurrentes del mes.
                </p>
              </div>
              {normalizedIncomePlanMonth.isClosed && (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-300">
                  Mes cerrado
                </span>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {incomePlanMonthLoading ? (
                <p className="text-sm text-slate-400">Cargando sueldos planificados...</p>
              ) : incomePlanMonthError ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {incomePlanMonthError}
                </p>
              ) : normalizedIncomePlanMonth.items.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                  No hay sueldos planificados para este mes.
                </div>
              ) : (
                <>
                  {normalizedIncomePlanMonth.message && (
                    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                      {normalizedIncomePlanMonth.message}
                    </div>
                  )}

                  {normalizedIncomePlanMonth.items.map((item) => (
                    <IncomePlanMonthItem
                      key={`income-plan-${item.plan_id}`}
                      item={item}
                      disabled={!normalizedIncomePlanMonth.canResolve}
                      loadingAction={
                        activeIncomePlanAction?.id === item.plan_id
                          ? activeIncomePlanAction.type
                          : null
                      }
                      onConfirm={handleConfirmIncomePlan}
                      onAdjust={(selectedItem) => {
                        setAdjustModalError(null);
                        setAdjustingPlan(selectedItem);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </section>

          {unplanned_total > 0 && (
            <section className="rounded-[32px] border border-amber-400/16 bg-amber-500/8 p-5 text-amber-100 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">
                Atención
              </p>
              <p className="mt-2 text-base font-medium">
                Gastos no planificados este mes: <strong>{unplanned_total} €</strong>
              </p>
            </section>
          )}
        </div>
      </section>

      <AdjustIncomePlanModal
        key={adjustingPlan?.id || "closed-adjust-income-plan"}
        isOpen={Boolean(adjustingPlan)}
        item={adjustingPlan}
        budgetYear={year}
        budgetMonth={month}
        loading={adjustModalLoading}
        error={adjustModalError}
        onClose={() => {
          setAdjustingPlan(null);
          setAdjustModalError(null);
        }}
        onSubmit={handleAdjustIncomePlan}
      />

      <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
    </div>
  );
}
