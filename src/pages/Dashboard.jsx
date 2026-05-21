import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage, unwrapCollectionResponse } from "../services/api";
import MonthNavigation from "../components/MonthNavigation";
import QuickAddIncome from "../components/QuickAddIncome";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import MobilePrimaryAction from "../components/MobilePrimaryAction";
import { getCategories } from "../services/categories";
import recurringPaymentsService from "../services/recurringPaymentsService";
import {
  buildCategoryMap,
  getCategoryDisplayColor,
  getCategoryDisplayIcon,
  getCategoryDisplayName,
} from "../utils/categories";
import { getPayerDisplayName } from "../utils/payers";

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

function getCategoryMeta(item, categoryMap) {
  const name = getCategoryDisplayName(item, categoryMap);
  const color = getCategoryDisplayColor(item, categoryMap);

  return {
    name,
    color: color || getFallbackColor(name || item?.category || item?.id),
    icon: getCategoryDisplayIcon(item, categoryMap),
  };
}

function getExpenseCategoryKey(expense, meta) {
  const rawCategoryId =
    expense?.category_detail?.id ??
    expense?.category?.id ??
    (typeof expense?.category === "number" || typeof expense?.category === "string"
      ? expense.category
      : null);

  if (rawCategoryId !== null && rawCategoryId !== undefined && rawCategoryId !== "") {
    return `category:${rawCategoryId}`;
  }

  return `category-name:${meta.name}`;
}

function getExpenseCategoryId(expense) {
  return (
    expense?.category_detail?.id ??
    expense?.category?.id ??
    (typeof expense?.category === "number" || typeof expense?.category === "string"
      ? expense.category
      : null)
  );
}

function getExpenseIdentity(expense, index) {
  if (expense?.id !== null && expense?.id !== undefined) {
    return `id:${expense.id}`;
  }

  return [
    "fallback",
    expense?.date || "",
    expense?.amount || "",
    expense?.description || expense?.name || "",
    expense?.category || "",
    index,
  ].join(":");
}

function dedupeExpenses(expenses = []) {
  const seen = new Set();

  return expenses.filter((expense, index) => {
    const identity = getExpenseIdentity(expense, index);
    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
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

function formatDisplayDate(value) {
  const parts = parseDateParts(value);

  if (!parts) {
    return "Sin fecha";
  }

  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

function getExpenseDisplayName(expense) {
  if (typeof expense?.name === "string" && expense.name.trim()) {
    return expense.name.trim();
  }

  if (typeof expense?.description === "string" && expense.description.trim()) {
    return expense.description.trim();
  }

  if (expense?.id !== null && expense?.id !== undefined) {
    return `Gasto #${expense.id}`;
  }

  return "Gasto";
}

function getExpenseTimestamp(expense) {
  if (!expense?.date) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(expense.date).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function isRecurringExpense(expense) {
  return Boolean(
    expense?.recurring_payment ||
      expense?.recurring_payment_id ||
      expense?.recurring_payment_detail ||
      expense?.is_recurring === true
  );
}

function getMonthIndex(year, month) {
  return year * 12 + (month - 1);
}

function getMonthDistance(startYear, startMonth, endYear, endMonth) {
  return getMonthIndex(endYear, endMonth) - getMonthIndex(startYear, startMonth);
}

function addMonths(year, month, offset) {
  const date = new Date(year, month - 1 + offset, 1);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function formatMonthShort(year, month, includeYear = false) {
  const formatted = new Intl.DateTimeFormat("es-ES", {
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  })
    .format(new Date(year, month - 1, 1))
    .replace(".", "");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getRecurringPaymentId(expense) {
  const rawId =
    expense?.recurring_payment_detail?.id ??
    expense?.recurring_payment?.id ??
    expense?.recurring_payment_id ??
    expense?.recurring_payment;

  if (rawId === null || rawId === undefined || rawId === "") {
    return null;
  }

  const numericId = Number(rawId);
  return Number.isFinite(numericId) ? numericId : null;
}

function buildRecurringSpentFallback(expenses) {
  const spentByRecurring = new Map();

  for (const expense of expenses) {
    const recurringId = getRecurringPaymentId(expense);
    if (!recurringId) continue;

    spentByRecurring.set(
      recurringId,
      (spentByRecurring.get(recurringId) || 0) + Number(expense?.amount || 0)
    );
  }

  return spentByRecurring;
}

function buildBudgetRecurringMap(items) {
  const map = new Map();

  for (const item of items) {
    const numericId = Number(item?.id);
    if (Number.isFinite(numericId)) {
      map.set(numericId, item);
    }
  }

  return map;
}

function getRecurringMonthlyAmount(recurring, budgetItem) {
  const rawAmount =
    budgetItem?.planned_amount ??
    budgetItem?.amount ??
    recurring?.amount ??
    recurring?.planned_amount;
  const amount = Number(rawAmount || 0);

  return Number.isFinite(amount) ? amount : 0;
}

function getRecurringPaidThisMonth(recurring, budgetItem, spentFallback) {
  const budgetSpent = Number(budgetItem?.spent_amount);

  if (Number.isFinite(budgetSpent)) {
    return budgetSpent;
  }

  const recurringId = Number(recurring?.id);

  return Number.isFinite(recurringId) ? spentFallback.get(recurringId) || 0 : 0;
}

function getRecurringPayerName(recurring, budgetItem) {
  const payerDetail = recurring?.payer_detail ?? budgetItem?.payer_detail;

  if (payerDetail) {
    return getPayerDisplayName(payerDetail);
  }

  if (recurring?.payer !== null && recurring?.payer !== undefined && recurring.payer !== "") {
    return `Pagador #${recurring.payer}`;
  }

  if (budgetItem?.payer !== null && budgetItem?.payer !== undefined && budgetItem.payer !== "") {
    return `Pagador #${budgetItem.payer}`;
  }

  return null;
}

function calculateRecurringPendingProjection({
  recurring,
  budgetItem,
  spentFallback,
  activeYear,
  activeMonth,
}) {
  if (!recurring?.end_date || recurring?.active !== true) {
    return null;
  }

  const endParts = parseDateParts(recurring.end_date);
  if (!endParts) {
    return null;
  }

  const monthDistance = getMonthDistance(
    activeYear,
    activeMonth,
    endParts.year,
    endParts.month
  );

  if (monthDistance < 0) {
    return null;
  }

  const monthlyAmount = getRecurringMonthlyAmount(recurring, budgetItem);
  if (monthlyAmount <= 0) {
    return null;
  }

  const paidThisMonth = Math.max(
    getRecurringPaidThisMonth(recurring, budgetItem, spentFallback),
    0
  );
  const currentMonthRemaining = Math.max(monthlyAmount - paidThisMonth, 0);
  const pendingMonths = [];

  for (let offset = 0; offset <= monthDistance; offset += 1) {
    const target = addMonths(activeYear, activeMonth, offset);
    const isActiveMonth = offset === 0;
    const amount = isActiveMonth ? currentMonthRemaining : monthlyAmount;

    if (amount <= 0) {
      continue;
    }

    pendingMonths.push({
      ...target,
      label: formatMonthShort(target.year, target.month),
      amount,
      status: isActiveMonth && paidThisMonth > 0 ? "partial" : "pending",
    });
  }

  const pendingTotal = pendingMonths.reduce((sum, item) => sum + item.amount, 0);

  if (pendingTotal <= 0 || pendingMonths.length === 0) {
    return null;
  }

  return {
    id: recurring.id,
    name: recurring.name || budgetItem?.name || "Pago fijo",
    monthlyAmount,
    endDate: recurring.end_date,
    endLabel: formatMonthShort(endParts.year, endParts.month, true),
    payerName: getRecurringPayerName(recurring, budgetItem),
    paidThisMonth,
    pendingMonths,
    pendingMonthsCount: pendingMonths.length,
    pendingTotal,
  };
}

function ChartShell({ title, description, children, className = "" }) {
  return (
    <article
      className={`min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6 ${className}`}
    >
      <div className="mb-4 sm:mb-5">
        <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {children}
    </article>
  );
}

function CategoryExpenseDetails({ expenses }) {
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const dateDiff = getExpenseTimestamp(b) - getExpenseTimestamp(a);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return Number(b.amount || 0) - Number(a.amount || 0);
    });
  }, [expenses]);

  return (
    <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
      {sortedExpenses.map((expense, index) => {
        const payerName = expense?.payer_detail
          ? getPayerDisplayName(expense.payer_detail)
          : null;

        return (
          <div
            key={getExpenseIdentity(expense, index)}
            className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {getExpenseDisplayName(expense)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  <span>{formatDisplayDate(expense.date)}</span>
                  {payerName ? (
                    <>
                      <span className="text-slate-600">·</span>
                      <span>Paga: {payerName}</span>
                    </>
                  ) : null}
                  {isRecurringExpense(expense) ? (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="rounded-full border border-white/8 bg-black/20 px-2 py-0.5 text-[11px] text-slate-300">
                        Recurrente
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <p className="shrink-0 text-right text-sm font-semibold text-red-300">
                - {formatCurrency(expense.amount)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpensePieChart({
  items,
  totalExpenses,
  expandedCategoryKey,
  onToggleCategory,
}) {
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
    const percent = item.percentage;
    stops.push(`${item.color} ${cursor}% ${cursor + percent}%`);
    cursor += percent;
  });

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto flex w-full max-w-[220px] items-center justify-center sm:max-w-[240px]">
        <div
          className="relative flex aspect-square w-full max-w-56 items-center justify-center rounded-full"
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
          const share = item.percentage;
          const isExpanded = expandedCategoryKey === item.key;
          const detailsId = `category-expenses-${item.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

          return (
            <div
              key={item.key}
              className={`rounded-[24px] border bg-black/20 px-4 py-3 transition ${
                isExpanded
                  ? "border-blue-300/25"
                  : "border-white/8 hover:border-white/14"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleCategory(item.key)}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                className="w-full text-left"
              >
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {share.toFixed(1)}% del gasto del mes
                    </p>
                    <p className="mt-1 text-xs text-blue-200">
                      {isExpanded ? "Ocultar gastos" : "Ver gastos"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(item.total)}
                    </p>
                    <span
                      className={`text-sm text-slate-400 transition ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ⌄
                    </span>
                  </div>
                </div>
              </button>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${share}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div id={detailsId} hidden={!isExpanded}>
                {isExpanded ? (
                  <CategoryExpenseDetails expenses={item.expenses} />
                ) : null}
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
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-end gap-1.5 sm:gap-2">
        {days.map((day) => {
          const height = Math.max(8, (day.total / maxAmount) * 160);

          return (
            <div key={day.day} className="flex w-9 flex-col items-center gap-2 sm:w-10">
              <div className="flex h-[190px] w-full items-end justify-center sm:h-[210px]">
                <div
                  className="w-6 rounded-t-2xl bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-[0_12px_24px_rgba(16,185,129,0.2)] sm:w-7"
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
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-400">Saldo neto</p>
            <p className={`mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl ${balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
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
              <div className="mb-2 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="text-sm font-medium text-white">{row.label}</p>
                <p className="break-words text-sm font-semibold text-slate-100 sm:text-right">
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

function getExpensePayerLabel(expense) {
  if (expense?.payer_detail) {
    return getPayerDisplayName(expense.payer_detail);
  }

  if (expense?.payer !== null && expense?.payer !== undefined && expense.payer !== "") {
    return `Pagador #${expense.payer}`;
  }

  return "Sin pagador";
}

function getExpensePayerKey(expense) {
  const payerId = expense?.payer_detail?.id ?? expense?.payer;

  if (payerId !== null && payerId !== undefined && payerId !== "") {
    return `payer:${payerId}`;
  }

  return "payer:none";
}

function PayerSummary({ items, totalExpenses }) {
  if (!items.length || totalExpenses <= 0) {
    return (
      <p className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
        No hay pagos registrados para resumir por persona.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const share = (item.total / totalExpenses) * 100;

        return (
          <div
            key={item.key}
            className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.count} movimiento{item.count === 1 ? "" : "s"} · {share.toFixed(1)}%
                </p>
              </div>
              <p className="shrink-0 text-right text-sm font-semibold text-white">
                {formatCurrency(item.total)}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.max(6, share)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeadlineCommitmentsTimeline({ commitments }) {
  if (!commitments.length) {
    return (
      <p className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
        No hay pagos fijos activos con fecha de finalización y saldo pendiente
        para este mes.
      </p>
    );
  }

  const totalPending = commitments.reduce(
    (sum, item) => sum + item.pendingTotal,
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-500/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/70">
            Pendiente total
          </p>
          <p className="mt-1 break-words text-xl font-semibold text-emerald-100">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="rounded-[24px] border border-blue-400/15 bg-blue-500/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-blue-200/70">
            Compromisos
          </p>
          <p className="mt-1 text-xl font-semibold text-blue-100">
            {commitments.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Vista
          </p>
          <p className="mt-1 text-sm font-medium text-slate-200">
            Meses pendientes hasta la fecha fin
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {commitments.map((commitment) => (
          <article
            key={commitment.id}
            className="grid min-w-0 gap-4 overflow-hidden rounded-[28px] border border-white/8 bg-black/20 p-4 sm:grid-cols-[minmax(190px,260px)_minmax(0,1fr)] sm:items-center"
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-3 sm:block">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">
                    {commitment.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatCurrency(commitment.monthlyAmount)}/mes · termina{" "}
                    {commitment.endLabel}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-300/20 bg-blue-500/12 px-2.5 py-1 text-[11px] font-medium text-blue-100 sm:mt-3 sm:inline-flex">
                  {commitment.pendingMonthsCount} mes
                  {commitment.pendingMonthsCount === 1 ? "" : "es"}
                </span>
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-emerald-200">
                Pendiente: {formatCurrency(commitment.pendingTotal)}
              </p>
              {commitment.payerName ? (
                <p className="mt-1 truncate text-xs text-slate-500">
                  Paga: {commitment.payerName}
                </p>
              ) : null}
            </div>

            <div className="relative min-w-0">
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#090d12] to-transparent" />
              <div className="max-w-full overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 pr-8">
                  {commitment.pendingMonths.map((monthItem) => {
                    const isPartial = monthItem.status === "partial";

                    return (
                      <div
                        key={`${commitment.id}-${monthItem.year}-${monthItem.month}`}
                        className="w-[72px] shrink-0 sm:w-20"
                      >
                        <p className="truncate text-center text-[11px] font-medium text-slate-400">
                          {monthItem.label}
                        </p>
                        <div
                          className={`mt-2 h-9 rounded-2xl border shadow-[0_10px_22px_rgba(14,165,233,0.12)] ${
                            isPartial
                              ? "border-amber-300/25 bg-gradient-to-r from-amber-400/80 to-cyan-400/75"
                              : "border-cyan-300/20 bg-gradient-to-r from-blue-500/80 to-cyan-400/80"
                          }`}
                          title={`${monthItem.label}: ${formatCurrency(monthItem.amount)}`}
                        />
                        <p className="mt-1 truncate text-center text-[10px] text-slate-500">
                          {formatCurrency(monthItem.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        ))}
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
  const [categories, setCategories] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [budgetRecurring, setBudgetRecurring] = useState([]);
  const [expandedCategoryKey, setExpandedCategoryKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          expensesResponse,
          incomesResponse,
          categoriesResponse,
          recurringResponse,
          budgetResponse,
        ] = await Promise.all([
          api.get("/expenses/", { params: { year, month } }),
          api.get("/incomes/", { params: { year, month } }),
          getCategories(),
          recurringPaymentsService.getAll().catch((recurringError) => {
            console.error(recurringError);
            return [];
          }),
          api.get("/budget/", { params: { year, month } }).catch((budgetError) => {
            console.error(budgetError);
            return null;
          }),
        ]);

        const normalizedExpenses = dedupeExpenses(
          unwrapCollectionResponse(expensesResponse)
        );
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
        setCategories(categoriesResponse);
        setRecurringPayments(unwrapCollectionResponse(recurringResponse));
        setBudgetRecurring(
          Array.isArray(budgetResponse?.recurring) ? budgetResponse.recurring : []
        );
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

  useEffect(() => {
    setExpandedCategoryKey(null);
  }, [month, year]);

  const balance = totalIncome - totalExpenses;
  const balancePositive = balance >= 0;
  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);

  const expenseCategories = useMemo(() => {
    const grouped = new Map();

    for (const expense of expenses) {
      const meta = getCategoryMeta(expense, categoryMap);
      const key = getExpenseCategoryKey(expense, meta);
      const current = grouped.get(key) || {
        key,
        categoryId: getExpenseCategoryId(expense),
        categoryName: meta.name,
        categoryIcon: meta.icon,
        name: meta.name,
        color: meta.color,
        icon: meta.icon,
        total: 0,
        count: 0,
        expenses: [],
      };

      current.total += Number(expense.amount || 0);
      current.count += 1;
      current.expenses.push(expense);
      grouped.set(key, current);
    }

    return [...grouped.values()]
      .map((item) => ({
        ...item,
        percentage: totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [categoryMap, expenses, totalExpenses]);

  const payerSummary = useMemo(() => {
    const grouped = new Map();

    for (const expense of expenses) {
      const key = getExpensePayerKey(expense);
      const name = getExpensePayerLabel(expense);
      const current = grouped.get(key) || {
        key,
        name,
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

  const deadlineCommitments = useMemo(() => {
    const spentFallback = buildRecurringSpentFallback(expenses);
    const budgetRecurringMap = buildBudgetRecurringMap(budgetRecurring);

    return recurringPayments
      .map((recurring) =>
        calculateRecurringPendingProjection({
          recurring,
          budgetItem: budgetRecurringMap.get(Number(recurring?.id)),
          spentFallback,
          activeYear: year,
          activeMonth: month,
        })
      )
      .filter(Boolean)
      .sort((a, b) => {
        const aEnd = parseDateParts(a.endDate);
        const bEnd = parseDateParts(b.endDate);
        const endDiff =
          getMonthIndex(aEnd?.year || 9999, aEnd?.month || 12) -
          getMonthIndex(bEnd?.year || 9999, bEnd?.month || 12);

        if (endDiff !== 0) {
          return endDiff;
        }

        return b.pendingTotal - a.pendingTotal;
      });
  }, [budgetRecurring, expenses, month, recurringPayments, year]);

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
    <section className="min-w-0 space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white capitalize sm:text-3xl">
            {monthLabel}
          </h1>
          <p className="text-sm text-slate-400">Resumen financiero del mes</p>
        </div>

        <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
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
        <div className="min-w-0 rounded-3xl border border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Ingresos</p>
            <span className="text-xl text-emerald-300">↗</span>
          </div>
          <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            + {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/8 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(255,255,255,0.03))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Gastos</p>
            <span className="text-xl text-red-300">↘</span>
          </div>
          <p className="mt-4 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            − {formatCurrency(totalExpenses)}
          </p>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Balance</p>
            <span className={`text-xl ${balancePositive ? "text-emerald-300" : "text-red-300"}`}>
              {balancePositive ? "↥" : "↧"}
            </span>
          </div>
          <p
            className={`mt-4 break-words text-2xl font-semibold tracking-tight sm:text-3xl ${
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
          <ExpensePieChart
            items={expenseCategories}
            totalExpenses={totalExpenses}
            expandedCategoryKey={expandedCategoryKey}
            onToggleCategory={(categoryKey) =>
              setExpandedCategoryKey((current) =>
                current === categoryKey ? null : categoryKey
              )
            }
          />
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

        <ChartShell
          title="Compromisos con fecha límite"
          description="Pagos fijos activos que tienen fecha fin y saldo proyectado pendiente."
          className="xl:col-span-5"
        >
          <DeadlineCommitmentsTimeline commitments={deadlineCommitments} />
        </ChartShell>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                Ingresos recientes
              </h2>
              <p className="text-sm text-slate-400">
                Últimos movimientos del mes seleccionado
              </p>
            </div>
            <button
              onClick={() => navigate("/incomes")}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1] sm:w-auto"
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
                  className="flex min-w-0 flex-col gap-3 rounded-[28px] border border-white/8 bg-black/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {income.category_detail?.name || "Ingreso"}
                    </p>
                    <p className="break-words text-sm text-slate-400">
                      {income.description || income.date}
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="break-words font-semibold text-emerald-300">
                      + {Number(income.amount).toFixed(2)} €
                    </p>
                    <p className="text-xs text-slate-500">{income.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
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
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          <span className="mr-2">{item.icon}</span>
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.count} movimiento{item.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-white sm:text-right">
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

        <div className="min-w-0 rounded-3xl border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Pagado por persona
            </h2>
            <p className="text-sm text-slate-400">
              Total de gastos del mes agrupado por pagador
            </p>
          </div>

          <PayerSummary items={payerSummary} totalExpenses={totalExpenses} />
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
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
              const [expensesResponse, incomesResponse, categoriesResponse] = await Promise.all([
                api.get("/expenses/", { params: { year, month } }),
                api.get("/incomes/", { params: { year, month } }),
                getCategories(),
              ]);

              const normalizedExpenses = dedupeExpenses(
                unwrapCollectionResponse(expensesResponse)
              );
              const normalizedIncomes = unwrapCollectionResponse(incomesResponse);

              setExpenses(normalizedExpenses);
              setCategories(categoriesResponse);
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
          buttonClassName="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 sm:w-auto"
        />
      </div>

      <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
    </section>
  );
};

export default Dashboard;
