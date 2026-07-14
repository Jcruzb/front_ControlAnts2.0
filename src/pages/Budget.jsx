import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import BudgetItem from "../components/BudgetItem";
import AdjustIncomePlanModal from "../components/AdjustIncomePlanModal";
import CreateIncomePlanModal from "../components/CreateIncomePlanModal";
import IncomePlanMonthItem from "../components/IncomePlanMonthItem";
import MonthNavigation from "../components/MonthNavigation";
import ExpenseDetailSheet from "../components/ExpenseDetailSheet";
import ExpenseFormModal from "../components/ExpenseFormModal";
import InfoTooltip from "../components/InfoTooltip";
import QuickPayTotalModal from "../components/QuickPayTotalModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import { useAuth } from "../hooks/useAuth";
import api, {
  getApiErrorMessage,
  unwrapCollectionResponse,
} from "../services/api";
import QuickAddIncome from "../components/QuickAddIncome";
import MobilePrimaryAction from "../components/MobilePrimaryAction";
import ListControls from "../components/ListControls";
import { getCategories } from "../services/categories";
import { getFamilyMembers } from "../services/familyMembers";
import {
  createIncomePlan,
  adjustIncomePlan,
  confirmIncomePlan,
  deleteIncomePlan,
  updateIncomePlan,
  getIncomePlansMonth,
} from "../services/incomePlans";
import recurringPaymentsService from "../services/recurringPaymentsService";
import {
  updateLegacyPlannedExpenseMonthStatus,
  updatePlannedExpensePlanMonthStatus,
} from "../services/plannedExpenses";
import { parseAmount } from "../utils/amounts";
import {
  buildCategoryMap,
  getCategoryDisplayIcon,
  getCategoryDisplayName,
} from "../utils/categories";
import { getTodayLocalDate } from "../utils/date";
import { getPayerDisplayName } from "../utils/payers";
import { buildMonthlyBudgetSummary } from "../utils/budgetSummary";
import {
  formatDifference,
  getPaidAmount,
  getPaymentStatus,
  getPendingAmount,
  isCompletedMonthConflict,
  isMonthCompleted,
  mergeMonthStatus,
  PAYMENT_STATUS_LABELS,
} from "../utils/recurringMonthStatus";

function getBudgetItemLabel(item, type) {
  if (type === "planned") {
    return getBudgetItemCategoryName(item);
  }

  return String(item?.name || getBudgetItemCategoryName(item) || "Sin categoría");
}

function getBudgetItemSearchText(item, type) {
  return [
    getBudgetItemLabel(item, type),
    item?.status,
    item?.category_detail?.name,
    item?.category_detail?.icon,
    item?.planned_amount,
    item?.spent_amount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getBudgetItemCategoryName(item) {
  if (typeof item?.category_detail?.name === "string") {
    return item.category_detail.name;
  }

  if (typeof item?.category_name === "string") {
    return item.category_name;
  }

  if (typeof item?.category === "string") {
    return item.category;
  }

  return "Sin categoría";
}

function getBudgetItemCategoryValue(item) {
  if (item?.category_detail?.id != null) {
    return String(item.category_detail.id);
  }

  if (item?.category_id != null) {
    return String(item.category_id);
  }

  if (typeof item?.category === "number" || typeof item?.category === "string") {
    return String(item.category);
  }

  return getBudgetItemCategoryName(item).toLowerCase();
}

function getBudgetExpenseCategoryName(expense) {
  if (typeof expense?.category_detail?.name === "string") {
    return expense.category_detail.name;
  }

  if (typeof expense?.category_name === "string") {
    return expense.category_name;
  }

  if (typeof expense?.category === "string") {
    return expense.category;
  }

  return null;
}

function getExpenseCategoryValue(expense) {
  if (expense?.category_detail?.id != null) {
    return String(expense.category_detail.id);
  }

  if (expense?.category?.id != null) {
    return String(expense.category.id);
  }

  if (typeof expense?.category === "number" || typeof expense?.category === "string") {
    return String(expense.category);
  }

  return getBudgetExpenseCategoryName(expense)?.toLowerCase() || "uncategorized";
}

function getExpenseDisplayName(expense) {
  if (typeof expense?.name === "string" && expense.name.trim()) {
    return expense.name.trim();
  }

  if (typeof expense?.description === "string" && expense.description.trim()) {
    return expense.description.trim();
  }

  if (expense?.id != null) {
    return `Gasto #${expense.id}`;
  }

  return "Gasto";
}

function getExpenseIdentity(expense, index) {
  if (expense?.id != null) {
    return `expense-${expense.id}`;
  }

  return [
    "expense",
    expense?.date || "",
    expense?.amount || "",
    expense?.description || expense?.name || "",
    expense?.category || "",
    index,
  ].join(":");
}

function isRecurringLinkedExpense(expense) {
  return Boolean(
    expense?.recurring_payment ||
      expense?.recurring_payment_id ||
      expense?.recurring_payment_detail ||
      expense?.is_recurring === true
  );
}

function isPlannedLinkedExpense(expense) {
  return Boolean(
    expense?.planned_expense ||
      expense?.planned_expense_id ||
      expense?.planned_expense_detail ||
      expense?.planned_expense_plan ||
      expense?.planned_expense_plan_id
  );
}

function isVariableExpense(expense) {
  return !isRecurringLinkedExpense(expense) && !isPlannedLinkedExpense(expense);
}

function getExpenseTimestamp(expense) {
  if (!expense?.date) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = new Date(expense.date).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function formatBudgetDisplayDate(value) {
  if (!value) {
    return "Sin fecha";
  }

  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getBudgetPaymentState(item) {
  if (item?.payment_status) return item.payment_status;
  const planned = Number(item?.planned_amount || 0);
  const spent = getPaidAmount(item);

  if (spent <= 0) return "pending";
  if (planned > 0 && spent === planned) return "covered";
  if (planned > 0 && spent > planned) return "exceeded";
  return "partially_paid";
}

function getBudgetPaymentStateLabel(state) {
  switch (state) {
    case "pending": return "Pendiente";
    case "partially_paid": return "Parcialmente pagado";
    case "covered": return "Pagado";
    case "exceeded": return "Presupuesto superado";
    case "completed": return "Completado";
    default:
      return "Todos";
  }
}

function getBudgetPaymentStateRank(state) {
  switch (state) {
    case "pending":
      return 0;
    case "partially_paid":
      return 1;
    case "covered":
      return 2;
    case "exceeded": return 3;
    case "completed": return 4;
    default:
      return 3;
  }
}

const EMPTY_BUDGET = {
  status: "ok",
  remaining_amount: 0,
  total_planned: 0,
  total_spent: 0,
  actual_spent: 0,
  planned: [],
  recurring: [],
  unplanned_total: 0,
};

function MetricLabel({ children, help }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
      <span className="min-w-0 break-words">{children}</span>
      <InfoTooltip label={help}>
        {help}
      </InfoTooltip>
    </div>
  );
}

function VariableExpenseItem({ expense, categoryMap }) {
  const title = getExpenseDisplayName(expense);
  const categoryName = getCategoryDisplayName(expense, categoryMap);
  const categoryIcon = getCategoryDisplayIcon(expense, categoryMap, "💸");
  const payerName = expense?.payer_detail
    ? getPayerDisplayName(expense.payer_detail)
    : null;

  return (
    <article className="w-full min-w-0 max-w-full overflow-hidden rounded-[28px] border border-blue-400/14 bg-blue-500/[0.055] p-4 shadow-[0_14px_32px_rgba(0,0,0,0.18)]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-300/15 bg-white/[0.05] text-lg">
            {categoryIcon}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-white">
              {title}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span>{categoryName}</span>
              <span className="text-slate-600">·</span>
              <span>{formatBudgetDisplayDate(expense.date)}</span>
              {payerName ? (
                <>
                  <span className="text-slate-600">·</span>
                  <span>Paga: {payerName}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 sm:block sm:w-auto sm:text-right">
          <span className="inline-flex rounded-full border border-blue-300/20 bg-blue-500/12 px-2.5 py-1 text-[11px] font-medium text-blue-100">
            Variable
          </span>
          <p className="text-sm font-semibold text-white sm:mt-2">
            {Number(expense?.amount || 0).toFixed(2)} €
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Budget() {
  const { profile } = useAuth();
  const canManagePlans = profile?.role === "admin";
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
  const [budgetExpenses, setBudgetExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [payers, setPayers] = useState([]);
  const [payersError, setPayersError] = useState(null);

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
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createPlanError, setCreatePlanError] = useState(null);
  const [createPlanLoading, setCreatePlanLoading] = useState(false);
  const [editingIncomePlan, setEditingIncomePlan] = useState(null);
  const [budgetSearch, setBudgetSearch] = useState("");
  const [budgetSort, setBudgetSort] = useState("payment_asc");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [budgetTypeFilter, setBudgetTypeFilter] = useState("all");
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState("all");
  const [budgetView, setBudgetView] = useState("expenses");
  const [expandedPlannedExpenseId, setExpandedPlannedExpenseId] = useState(null);
  const [expandedRecurringExpenseId, setExpandedRecurringExpenseId] = useState(null);
  const [activeQuickBudgetAction, setActiveQuickBudgetAction] = useState(null);
  const [quickPayTotalState, setQuickPayTotalState] = useState({
    isOpen: false,
    item: null,
    type: null,
    error: null,
  });
  const [budgetDetailState, setBudgetDetailState] = useState({
    isOpen: false,
    loading: false,
    error: null,
    type: null,
    item: null,
    payments: [],
  });
  const [editingBudgetPayment, setEditingBudgetPayment] = useState(null);
  const [budgetPaymentFormLoading, setBudgetPaymentFormLoading] = useState(false);
  const [budgetPaymentFormError, setBudgetPaymentFormError] = useState(null);
  const [monthStatusAction, setMonthStatusAction] = useState({
    item: null,
    type: null,
    isCompleted: null,
    loading: false,
    error: null,
  });
  const activeBudgetDetailRequestRef = useRef(0);

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

  const fetchBudget = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

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
      if (!silent) {
        setLoading(false);
      }
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

  const fetchBudgetExpenses = useCallback(async () => {
    const response = await api.get("/expenses/", {
      params: { year, month },
    });

    setBudgetExpenses(unwrapCollectionResponse(response));
  }, [month, year]);

  function requestMonthStatusUpdate(item, type, isCompleted) {
    setMonthStatusAction({ item, type, isCompleted, loading: false, error: null });
  }

  async function confirmMonthStatusUpdate() {
    const { item, type, isCompleted } = monthStatusAction;
    if (!item?.id || typeof isCompleted !== "boolean") return;

    try {
      setMonthStatusAction((current) => ({ ...current, loading: true, error: null }));
      let updated;
      if (type === "recurring") {
        updated = await recurringPaymentsService.updateMonthStatus(
          item.id,
          year,
          month,
          isCompleted
        );
      } else if (
        item.source === "plan" ||
        item.plan_id != null ||
        item.planned_expense_plan != null
      ) {
        const planId = item.plan_id ?? item.planned_expense_plan;
        updated = await updatePlannedExpensePlanMonthStatus(
          planId,
          year,
          month,
          isCompleted
        );
      } else {
        updated = await updateLegacyPlannedExpenseMonthStatus(
          item.id,
          year,
          month,
          isCompleted
        );
      }
      await Promise.all([fetchBudget({ silent: true }), fetchBudgetExpenses()]);
      setBudgetDetailState((current) => {
        if (
          current.type !== type ||
          String(current.item?.id) !== String(item.id)
        ) {
          return current;
        }

        return {
          ...current,
          // The response `id` belongs to the monthly occurrence. Preserve the
          // payment identity so close -> reopen keeps targeting the same plan.
          item: mergeMonthStatus(current.item, updated),
        };
      });
      setMonthStatusAction({ item: null, type: null, isCompleted: null, loading: false, error: null });
    } catch (actionError) {
      console.error(actionError);
      if (isCompletedMonthConflict(actionError)) {
        await Promise.all([fetchBudget({ silent: true }), fetchBudgetExpenses()]);
      }
      setMonthStatusAction((current) => ({
        ...current,
        loading: false,
        error: getApiErrorMessage(actionError, "No se pudo actualizar el estado mensual"),
      }));
    }
  }

  const fetchIncomePlanMonth = useCallback(async () => {
    setIncomePlanMonthLoading(true);
    setIncomePlanMonthError(null);
    try {
      const response = await getIncomePlansMonth(year, month);
      setIncomePlanMonthData(response);
    } catch (err) {
      console.error(err);
      setIncomePlanMonthError(
        getApiErrorMessage(err, "No se pudieron cargar los salarios planificados")
      );
    } finally {
      setIncomePlanMonthLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudget();
    fetchIncomes();
    fetchIncomePlanMonth();
    fetchBudgetExpenses().catch((fetchError) => {
      console.error(fetchError);
    });
    getCategories()
      .then((categories) => setExpenseCategories(categories))
      .catch((fetchError) => {
        console.error(fetchError);
      });
    setPayersError(null);
    getFamilyMembers()
      .then((members) => setPayers(members))
      .catch((fetchError) => {
        console.error(fetchError);
        setPayersError(
          getApiErrorMessage(fetchError, "No se pudieron cargar los pagadores")
        );
      });
  }, [fetchBudget, fetchIncomePlanMonth, fetchIncomes, fetchBudgetExpenses]);

  useEffect(() => {
    setExpandedPlannedExpenseId(null);
    setExpandedRecurringExpenseId(null);
  }, [month, year]);

  async function handleQuickAddSubmit({
    amount,
    date,
    note,
    categoryId,
    plannedExpenseId,
    plannedExpensePlanId,
    recurringPaymentId,
    payer,
  }) {
    const parsedAmount = parseAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Introduce un importe válido mayor que 0");
    }

    const payload = {
      amount: parsedAmount.toFixed(2),
      date, // already resolved by the QuickAddExpense modal
      description: note || "",
      category: categoryId,
      planned_expense: plannedExpenseId,
      planned_expense_plan: plannedExpensePlanId,
      recurring_payment: recurringPaymentId,
    };
    if (payer) {
      payload.payer = Number(payer);
    }

    console.log("[QuickAdd] Enviando gasto:", payload);

    await api.post("/expenses/", payload);
    await Promise.all([fetchBudget({ silent: true }), fetchBudgetExpenses()]);
  }

  function getDefaultExpenseDateForCurrentBudget() {
    const now = new Date();
    const isCurrentBudgetMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;

    if (isCurrentBudgetMonth) {
      return getTodayLocalDate();
    }

    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  }

  function openQuickPayTotal(item, type) {
    if (!item) return;

    setQuickPayTotalState({
      isOpen: true,
      item,
      type,
      error: null,
    });
  }

  function closeQuickPayTotal() {
    if (activeQuickBudgetAction?.type === "pay") return;
    setQuickPayTotalState({
      isOpen: false,
      item: null,
      type: null,
      error: null,
    });
  }

  async function handleQuickPayTotalSubmit({ payer } = {}) {
    const item = quickPayTotalState.item;
    const type = quickPayTotalState.type;
    if (!item || !type) return;

    const label = getBudgetItemLabel(item, type);

    try {
      setQuickPayTotalState((current) => ({ ...current, error: null }));
      setActiveQuickBudgetAction({
        id: `${type}-${item.id}`,
        type: "pay",
      });
      await handleQuickAddSubmit({
        amount: Number(item.planned_amount || 0),
        date: getDefaultExpenseDateForCurrentBudget(),
        note: `Pago total de ${label}`,
        categoryId: item.category,
        plannedExpenseId:
          type === "planned" && item.source !== "plan" ? item.id : null,
        plannedExpensePlanId:
          type === "planned" && item.source === "plan" ? item.plan_id : null,
        recurringPaymentId: type === "recurring" ? item.id : null,
        payer,
      });
      setQuickPayTotalState({
        isOpen: false,
        item: null,
        type: null,
        error: null,
      });
    } catch (quickPayError) {
      console.error(quickPayError);
      setQuickPayTotalState((current) => ({
        ...current,
        error: getApiErrorMessage(
          quickPayError,
          "No se pudo registrar el pago total"
        ),
      }));
    } finally {
      setActiveQuickBudgetAction(null);
    }
  }

  function getBudgetItemLinkId(item) {
    if (item?.source === "plan" && Number.isFinite(Number(item?.plan_id))) {
      return Number(item.plan_id);
    }
    if (typeof item?.id === "number") {
      return item.id;
    }

    const numericId = Number(item?.id);
    return Number.isFinite(numericId) ? numericId : null;
  }

  function getQuickPayExpenseForItem(item, type) {
    if (!item) return null;

    const linkId = getBudgetItemLinkId(item);
    const label = getBudgetItemLabel(item, type);

    if (!linkId) {
      return null;
    }

    const matches = budgetExpenses.filter((expense) => {
      const expectedLinkField =
        type === "planned"
          ? item?.source === "plan"
            ? expense?.planned_expense_plan
            : expense?.planned_expense
          : expense?.recurring_payment;
      const expenseLinkId =
        expectedLinkField != null ? Number(expectedLinkField) : null;
      const expenseAmount = Number(expense?.amount || 0);
      const plannedAmount = Number(item?.planned_amount || 0);
      const description = String(expense?.description || "").trim();

      return (
        expenseLinkId === linkId &&
        expenseAmount === plannedAmount &&
        description === `Pago total de ${label}`
      );
    });

    return matches.length === 1 ? matches[0] : null;
  }

  async function handleQuickRevertPlannedExpense(item, type) {
    if (!item) return;

    const reversibleExpense = getQuickPayExpenseForItem(item, type);

    if (!reversibleExpense?.id) {
      return;
    }

    const label = getBudgetItemLabel(item, type);
    const confirmMessage = `¿Revertir el pago total de "${label}"? Se eliminará el registro de gasto creado por esta acción.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      setActiveQuickBudgetAction({
        id: `${type}-${item.id}`,
        type: "revert",
      });
      await api.delete(`/expenses/${reversibleExpense.id}/`);
      await Promise.all([fetchBudget({ silent: true }), fetchBudgetExpenses()]);
    } catch (quickRevertError) {
      console.error(quickRevertError);
      setError(
        getApiErrorMessage(
          quickRevertError,
          "No se pudo revertir el pago total"
        )
      );
    } finally {
      setActiveQuickBudgetAction(null);
    }
  }

  async function openBudgetItemDetail(item, type) {
    if (!item) return;

    const requestId = activeBudgetDetailRequestRef.current + 1;
    activeBudgetDetailRequestRef.current = requestId;

    if (type === "planned") {
      const plannedPayments = budgetExpenses.filter(
        (expense) =>
          Number(
            item?.source === "plan"
              ? expense?.planned_expense_plan
              : expense?.planned_expense
          ) === Number(getBudgetItemLinkId(item))
      );

      setBudgetDetailState({
        isOpen: true,
        loading: false,
        error: null,
        type,
        item,
        payments: plannedPayments,
      });
      return;
    }

    setBudgetDetailState({
      isOpen: true,
      loading: true,
      error: null,
      type,
      item,
      payments: [],
    });

    try {
      const detail = await recurringPaymentsService.getPayments(item.id);
      if (activeBudgetDetailRequestRef.current !== requestId) {
        return;
      }

      setBudgetDetailState({
        isOpen: true,
        loading: false,
        error: null,
        type,
        item,
        payments: Array.isArray(detail?.payments) ? detail.payments : [],
      });
    } catch (detailError) {
      console.error(detailError);
      if (activeBudgetDetailRequestRef.current !== requestId) {
        return;
      }

      setBudgetDetailState({
        isOpen: true,
        loading: false,
        error: getApiErrorMessage(
          detailError,
          "No se pudo cargar el detalle del gasto"
        ),
        type,
        item,
        payments: [],
      });
    }
  }

  function closeBudgetItemDetail() {
    activeBudgetDetailRequestRef.current += 1;
    setBudgetDetailState((current) => ({ ...current, isOpen: false }));
    setEditingBudgetPayment(null);
    setBudgetPaymentFormError(null);
  }

  async function handleSaveBudgetPayment(payload) {
    if (!editingBudgetPayment?.id) return;

    const parsedAmount = parseAmount(payload.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setBudgetPaymentFormError("El importe debe ser mayor que 0");
      return;
    }

    if (!String(payload.category).trim()) {
      setBudgetPaymentFormError("La categoría es obligatoria");
      return;
    }

    try {
      setBudgetPaymentFormLoading(true);
      setBudgetPaymentFormError(null);
      const response = await api.patch(`/expenses/${editingBudgetPayment.id}/`, {
        ...payload,
        amount: parsedAmount.toFixed(2),
        category: Number(payload.category),
      });

      setBudgetExpenses((current) =>
        current.map((expense) =>
          expense.id === editingBudgetPayment.id ? response : expense
        )
      );
      setBudgetDetailState((current) => ({
        ...current,
        payments: current.payments.map((payment) =>
          payment.id === editingBudgetPayment.id ? response : payment
        ),
      }));
      setEditingBudgetPayment(null);
      await fetchBudget({ silent: true });
    } catch (saveError) {
      console.error(saveError);
      setBudgetPaymentFormError(
        getApiErrorMessage(saveError, "No se pudo guardar el pago")
      );
    } finally {
      setBudgetPaymentFormLoading(false);
    }
  }

  async function handleDeleteBudgetPayment(payment) {
    if (
      !window.confirm(
        `¿Eliminar ${payment?.description || "este pago"}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/expenses/${payment.id}/`);
      setBudgetExpenses((current) =>
        current.filter((expense) => expense.id !== payment.id)
      );
      setBudgetDetailState((current) => ({
        ...current,
        payments: current.payments.filter((item) => item.id !== payment.id),
        isOpen:
          current.payments.filter((item) => item.id !== payment.id).length > 0
            ? current.isOpen
            : false,
      }));
      await fetchBudget({ silent: true });
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        getApiErrorMessage(deleteError, "No se pudo eliminar el pago")
      );
    }
  }

  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
  }, [incomes]);

  const totalSpentFromBudget = Number(data?.actual_spent ?? data?.total_spent ?? 0);
  const dedupedBudgetExpenses = useMemo(() => {
    const seen = new Set();

    return budgetExpenses.filter((expense, index) => {
      const identity = getExpenseIdentity(expense, index);

      if (seen.has(identity)) {
        return false;
      }

      seen.add(identity);
      return true;
    });
  }, [budgetExpenses]);
  const totalSpentFromExpenses = useMemo(() => {
    return dedupedBudgetExpenses.reduce(
      (sum, expense) => sum + Number(expense?.amount || 0),
      0
    );
  }, [dedupedBudgetExpenses]);

  const incomePlanMonthBlock = useMemo(() => {
    return incomePlanMonthData ?? data?.income_plan_month ?? null;
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

  const plannedRecurringIncome = useMemo(() => {
    return normalizedIncomePlanMonth.items.reduce((sum, item) => {
      if (item.status !== "PENDING") {
        return sum;
      }

      return sum + Number(item.planned_amount || 0);
    }, 0);
  }, [normalizedIncomePlanMonth.items]);

  const totalSpentReal = data ? totalSpentFromBudget : totalSpentFromExpenses;
  const selectedMonthId = data?.month_id ?? data?.income_plan_month?.month_id ?? null;
  const budgetData = data ?? EMPTY_BUDGET;
  const {
    total_planned,
    planned,
    recurring,
    unplanned_total,
  } = budgetData;
  const totalPlannedAmount = Number(total_planned || 0);
  const plannedRemainingAmount = Number(data?.total_pending_amount ?? 0);
  const expenseCategoryMap = useMemo(
    () => buildCategoryMap(expenseCategories),
    [expenseCategories]
  );
  const variableExpenses = useMemo(() => {
    return dedupedBudgetExpenses
      .filter((expense) => isVariableExpense(expense))
      .sort((a, b) => {
        const dateDiff = getExpenseTimestamp(b) - getExpenseTimestamp(a);

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return Number(b?.amount || 0) - Number(a?.amount || 0);
      });
  }, [dedupedBudgetExpenses]);
  const variableExpensesTotal = useMemo(() => {
    return variableExpenses.reduce(
      (sum, expense) => sum + Number(expense?.amount || 0),
      0
    );
  }, [variableExpenses]);
  const unplannedExpensesTotal =
    budgetExpenses.length > 0
      ? variableExpensesTotal
      : Number(unplanned_total || 0);
  const monthlySummary = buildMonthlyBudgetSummary({
    registeredIncome: totalIncome,
    pendingPlannedIncome: plannedRecurringIncome,
    plannedBudget: totalPlannedAmount,
    actualSpent: totalSpentReal,
    pendingPlannedExpenses: plannedRemainingAmount,
    unplannedSpent: unplannedExpensesTotal,
  });

  const budgetCategoryOptions = useMemo(() => {
    const categoryMap = new Map();

    planned.forEach((item) => {
      const value = getBudgetItemCategoryValue(item);
      const label = getBudgetItemCategoryName(item);

      if (!categoryMap.has(value)) {
        categoryMap.set(value, label);
      }
    });

    recurring.forEach((item) => {
      const value = getBudgetItemCategoryValue(item);
      const label = getBudgetItemCategoryName(item);

      if (!categoryMap.has(value)) {
        categoryMap.set(value, label);
      }
    });

    variableExpenses.forEach((expense) => {
      const value = getExpenseCategoryValue(expense);
      const label = getCategoryDisplayName(expense, expenseCategoryMap);

      if (!categoryMap.has(value)) {
        categoryMap.set(value, label);
      }
    });

    return [
      { value: "all", label: "Todas las categorias" },
      ...Array.from(categoryMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    ];
  }, [expenseCategoryMap, planned, recurring, variableExpenses]);

  const filteredPlanned = useMemo(() => {
    const normalizedSearch = budgetSearch.trim().toLowerCase();

    return [...planned]
      .filter((item) => {
        const paymentState = getBudgetPaymentState(item);
        const matchesFilter =
          budgetFilter === "all" || budgetFilter === paymentState;
        const matchesType =
          budgetTypeFilter === "all" || budgetTypeFilter === "planned";
        const matchesCategory =
          budgetCategoryFilter === "all" ||
          getBudgetItemCategoryValue(item) === budgetCategoryFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          getBudgetItemSearchText(item, "planned").includes(normalizedSearch);

        return matchesFilter && matchesType && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aState = getBudgetPaymentState(a);
        const bState = getBudgetPaymentState(b);

        switch (budgetSort) {
          case "amount_asc":
            return Number(a.planned_amount || 0) - Number(b.planned_amount || 0);
          case "amount_desc":
            return Number(b.planned_amount || 0) - Number(a.planned_amount || 0);
          case "name_asc":
            return getBudgetItemLabel(a, "planned").localeCompare(
              getBudgetItemLabel(b, "planned"),
              "es"
            );
          case "name_desc":
            return getBudgetItemLabel(b, "planned").localeCompare(
              getBudgetItemLabel(a, "planned"),
              "es"
            );
          case "payment_desc":
            return (
              getBudgetPaymentStateRank(bState) - getBudgetPaymentStateRank(aState) ||
              getBudgetItemLabel(a, "planned").localeCompare(
                getBudgetItemLabel(b, "planned"),
                "es"
              )
            );
          case "payment_asc":
          default:
            return (
              getBudgetPaymentStateRank(aState) - getBudgetPaymentStateRank(bState) ||
              getBudgetItemLabel(a, "planned").localeCompare(
                getBudgetItemLabel(b, "planned"),
                "es"
              )
            );
        }
      });
  }, [
    budgetCategoryFilter,
    budgetFilter,
    budgetSearch,
    budgetSort,
    budgetTypeFilter,
    planned,
  ]);

  const filteredRecurring = useMemo(() => {
    const normalizedSearch = budgetSearch.trim().toLowerCase();

    return [...recurring]
      .filter((item) => {
        const paymentState = getBudgetPaymentState(item);
        const matchesFilter =
          budgetFilter === "all" || budgetFilter === paymentState;
        const matchesType =
          budgetTypeFilter === "all" || budgetTypeFilter === "fixed";
        const matchesCategory =
          budgetCategoryFilter === "all" ||
          getBudgetItemCategoryValue(item) === budgetCategoryFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          getBudgetItemSearchText(item, "recurring").includes(normalizedSearch);

        return matchesFilter && matchesType && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const aState = getBudgetPaymentState(a);
        const bState = getBudgetPaymentState(b);

        switch (budgetSort) {
          case "amount_asc":
            return Number(a.planned_amount || 0) - Number(b.planned_amount || 0);
          case "amount_desc":
            return Number(b.planned_amount || 0) - Number(a.planned_amount || 0);
          case "name_asc":
            return getBudgetItemLabel(a, "recurring").localeCompare(
              getBudgetItemLabel(b, "recurring"),
              "es"
            );
          case "name_desc":
            return getBudgetItemLabel(b, "recurring").localeCompare(
              getBudgetItemLabel(a, "recurring"),
              "es"
            );
          case "payment_desc":
            return (
              getBudgetPaymentStateRank(bState) - getBudgetPaymentStateRank(aState) ||
              getBudgetItemLabel(a, "recurring").localeCompare(
                getBudgetItemLabel(b, "recurring"),
                "es"
              )
            );
          case "payment_asc":
          default:
            return (
              getBudgetPaymentStateRank(aState) - getBudgetPaymentStateRank(bState) ||
              getBudgetItemLabel(a, "recurring").localeCompare(
                getBudgetItemLabel(b, "recurring"),
                "es"
              )
            );
        }
      });
  }, [
    budgetCategoryFilter,
    budgetFilter,
    budgetSearch,
    budgetSort,
    budgetTypeFilter,
    recurring,
  ]);

  const filteredVariableExpenses = useMemo(() => {
    const normalizedSearch = budgetSearch.trim().toLowerCase();

    return variableExpenses.filter((expense) => {
      const matchesFilter = budgetFilter === "all" || budgetFilter === "paid";
      const matchesType =
        budgetTypeFilter === "all" || budgetTypeFilter === "variable";
      const matchesCategory =
        budgetCategoryFilter === "all" ||
        getExpenseCategoryValue(expense) === budgetCategoryFilter;
      const categoryName = getCategoryDisplayName(expense, expenseCategoryMap);
      const payerName = expense?.payer_detail
        ? getPayerDisplayName(expense.payer_detail)
        : "";
      const searchText = [
        getExpenseDisplayName(expense),
        categoryName,
        payerName,
        expense?.amount,
        expense?.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 || searchText.includes(normalizedSearch);

      return matchesFilter && matchesType && matchesCategory && matchesSearch;
    });
  }, [
    budgetCategoryFilter,
    budgetFilter,
    budgetSearch,
    budgetTypeFilter,
    expenseCategoryMap,
    variableExpenses,
  ]);

  const visibleBudgetItems =
    filteredPlanned.length + filteredRecurring.length + filteredVariableExpenses.length;
  const totalBudgetItems = planned.length + recurring.length + variableExpenses.length;
  const hasActiveBudgetFilters =
    budgetSearch.trim().length > 0 ||
    budgetSort !== "payment_asc" ||
    budgetFilter !== "all" ||
    budgetTypeFilter !== "all" ||
    budgetCategoryFilter !== "all";

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

  async function refreshIncomeArea() {
    await Promise.all([fetchBudget(), fetchIncomes(), fetchIncomePlanMonth()]);
  }

  async function handleConfirmIncomePlan(item) {
    const planId = item?.plan_id;
    if (!planId) return;

    try {
      setActiveIncomePlanAction({ id: planId, type: "confirm" });
      await confirmIncomePlan(planId, { year, month });
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setIncomePlanMonthError(
        getApiErrorMessage(err, "No se pudo confirmar el salario planificado")
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
      await adjustIncomePlan(planId, {
        ...payload,
        year,
        month,
      });
      setAdjustingPlan(null);
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setAdjustModalError(
        getApiErrorMessage(err, "No se pudo ajustar el salario planificado")
      );
    } finally {
      setAdjustModalLoading(false);
    }
  }

  async function handleCreateIncomePlan(payload) {
    if (!selectedMonthId) {
      setCreatePlanError("No se pudo identificar el mes seleccionado");
      return;
    }

    const categoryId = Number(payload.categoryId);
    const amount = parseAmount(payload.amount);
    const dueDay = payload.dueDay ? Number(payload.dueDay) : null;

    if (!categoryId) {
      setCreatePlanError("Debes seleccionar una categoría");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setCreatePlanError("Introduce un importe válido mayor que 0");
      return;
    }

    try {
      setCreatePlanError(null);
      setCreatePlanLoading(true);

      const plan = await createIncomePlan({
        category: categoryId,
        name: payload.name || "",
        plan_type: payload.planType,
        due_day: dueDay,
        active: true,
        start_month: selectedMonthId,
        end_month: payload.planType === "ONE_MONTH" ? selectedMonthId : null,
        planned_amount: amount.toFixed(2),
      });

      await confirmIncomePlan(plan.id, { year, month });

      setCreatePlanOpen(false);
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setCreatePlanError(
        getApiErrorMessage(err, "No se pudo crear el salario recurrente")
      );
    } finally {
      setCreatePlanLoading(false);
    }
  }

  async function handleSaveIncomePlan(payload) {
    if (editingIncomePlan) {
      const planId = editingIncomePlan.plan_id;
      const plannedAmount = parseAmount(payload.amount);

      if (!planId) {
        setCreatePlanError("No se pudo identificar el salario a editar");
        return;
      }

      if (!Number.isFinite(plannedAmount) || plannedAmount <= 0) {
        setCreatePlanError("Introduce un importe válido mayor que 0");
        return;
      }

      try {
        setCreatePlanError(null);
        setCreatePlanLoading(true);

        await updateIncomePlan(planId, {
          category: Number(payload.categoryId),
          name: payload.name || "",
          plan_type: payload.planType,
          due_day: payload.dueDay ? Number(payload.dueDay) : null,
          active: true,
          start_month: editingIncomePlan.start_month || selectedMonthId,
          end_month:
            payload.planType === "ONE_MONTH"
              ? editingIncomePlan.start_month || selectedMonthId
              : editingIncomePlan.end_month || null,
          planned_amount: plannedAmount.toFixed(2),
        });

        setEditingIncomePlan(null);
        setCreatePlanOpen(false);
        await refreshIncomeArea();
      } catch (err) {
        console.error(err);
        setCreatePlanError(
          getApiErrorMessage(err, "No se pudo editar el salario recurrente")
        );
      } finally {
        setCreatePlanLoading(false);
      }

      return;
    }

    await handleCreateIncomePlan(payload);
  }

  async function handleDeleteIncomePlan(item) {
    const planId = item?.plan_id;
    if (!planId) return;

    if (!window.confirm("¿Eliminar este salario recurrente?")) return;

    try {
      setIncomePlanMonthError(null);
      await deleteIncomePlan(planId);
      await refreshIncomeArea();
    } catch (err) {
      console.error(err);
      setIncomePlanMonthError(
        getApiErrorMessage(err, "No se pudo eliminar el salario recurrente")
      );
    }
  }

  const statusColor = monthlySummary.isOverBudget
    ? "text-red-300"
    : "text-emerald-300";

  return (
    <div className="min-w-0 max-w-full space-y-8 overflow-x-clip">
      <section className="min-w-0 max-w-full space-y-5">
        <div className="min-w-0 max-w-full overflow-hidden rounded-[36px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Budget mensual
          </p>
          <div className="mt-3 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {monthLabel}
              </h1>
              <p className={`mt-3 text-sm font-medium ${statusColor}`}>
                {monthlySummary.statusText}
              </p>
            </div>

            <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="min-w-0 rounded-[28px] border border-blue-300/20 bg-blue-500/[0.08] px-4 py-4">
                <MetricLabel help="Importe total previsto para cubrir gastos planificados y pagos fijos durante el mes.">
                  Presupuesto
                </MetricLabel>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-blue-50">
                  {monthlySummary.plannedBudget.toFixed(2)} €
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={`h-full rounded-full ${
                      monthlySummary.isOverBudget ? "bg-red-400" : "bg-blue-300"
                    }`}
                    style={{ width: `${monthlySummary.budgetUsagePercentage}%` }}
                  />
                </div>
                <p className={`mt-2 break-words text-xs ${monthlySummary.isOverBudget ? "text-red-200" : "text-blue-100"}`}>
                  {monthlySummary.isOverBudget
                    ? `${Math.abs(monthlySummary.budgetDifference).toFixed(2)} € de exceso`
                    : `${monthlySummary.budgetDifference.toFixed(2)} € disponibles`}
                </p>
              </div>
              <div className="min-w-0 rounded-[28px] border border-emerald-300/20 bg-emerald-500/[0.08] px-4 py-4">
                <MetricLabel help="Suma de los ingresos que ya están registrados en el mes. Los ingresos planificados pendientes se muestran aparte.">
                  Ingresos
                </MetricLabel>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-emerald-100">
                  {monthlySummary.registeredIncome.toFixed(2)} €
                </p>
                <p className="mt-3 break-words text-xs text-emerald-100/80">
                  {monthlySummary.pendingPlannedIncome > 0
                    ? `${monthlySummary.pendingPlannedIncome.toFixed(2)} € previstos por confirmar`
                    : "Ingresos del mes registrados"}
                </p>
              </div>
              <div className={`min-w-0 rounded-[28px] border px-4 py-4 ${monthlySummary.balance >= 0 ? "border-emerald-300/20 bg-emerald-500/[0.08]" : "border-red-300/25 bg-red-500/[0.1]"}`}>
                <MetricLabel help="Balance real del mes: ingresos registrados menos todos los gastos reales registrados.">
                  Balance
                </MetricLabel>
                <p className={`mt-2 break-words text-2xl font-semibold tracking-tight ${monthlySummary.balance >= 0 ? "text-emerald-100" : "text-red-100"}`}>
                  {monthlySummary.balance.toFixed(2)} €
                </p>
                <p className="mt-3 break-words text-xs text-slate-300">
                  Ingresos registrados − gasto real
                </p>
              </div>
              <div className="min-w-0 rounded-[28px] border border-white/15 bg-black/30 px-4 py-4">
                <MetricLabel help="Todos los movimientos de gasto registrados en el mes, tanto planificados como fijos y no planificados.">
                  Gasto real
                </MetricLabel>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
                  {monthlySummary.actualSpent.toFixed(2)} €
                </p>
                <p className="mt-3 break-words text-xs text-slate-300">
                  {monthlySummary.unplannedSpent.toFixed(2)} € no planificados · {monthlySummary.pendingPlannedExpenses.toFixed(2)} € por pagar
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

      <section className="rounded-[30px] border border-white/8 bg-white/[0.04] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBudgetView("expenses")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              budgetView === "expenses"
                ? "bg-emerald-400 text-slate-950"
                : "border border-white/10 bg-black/20 text-slate-200 hover:bg-white/[0.06]"
            }`}
          >
            Gastos
          </button>
          <button
            type="button"
            onClick={() => setBudgetView("incomes")}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              budgetView === "incomes"
                ? "bg-emerald-400 text-slate-950"
                : "border border-white/10 bg-black/20 text-slate-200 hover:bg-white/[0.06]"
            }`}
          >
            Ingresos
          </button>
        </div>
      </section>

      <section
        className={`grid gap-6 ${
          budgetView === "incomes"
            ? "xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]"
            : ""
        }`}
      >
        <div className="space-y-6">
          {budgetView === "expenses" ? (
            <ListControls
              searchValue={budgetSearch}
              onSearchChange={setBudgetSearch}
              searchPlaceholder="Buscar por categoría o nombre"
              sortValue={budgetSort}
              onSortChange={setBudgetSort}
              sortOptions={[
                { value: "payment_asc", label: "Pago: pendiente primero" },
                { value: "payment_desc", label: "Pago: pagado primero" },
                { value: "amount_desc", label: "Importe: mayor a menor" },
                { value: "amount_asc", label: "Importe: menor a mayor" },
                { value: "name_asc", label: "Nombre: A-Z" },
                { value: "name_desc", label: "Nombre: Z-A" },
              ]}
              filterValue={budgetFilter}
              onFilterChange={setBudgetFilter}
              filterOptions={[
                { value: "all", label: "Todos" },
                { value: "pending", label: getBudgetPaymentStateLabel("pending") },
                { value: "partially_paid", label: getBudgetPaymentStateLabel("partially_paid") },
                { value: "covered", label: getBudgetPaymentStateLabel("covered") },
                { value: "exceeded", label: getBudgetPaymentStateLabel("exceeded") },
                { value: "completed", label: getBudgetPaymentStateLabel("completed") },
              ]}
              extraSelectValue={budgetCategoryFilter}
              onExtraSelectChange={setBudgetCategoryFilter}
              extraSelectLabel="Categoria"
              extraSelectOptions={budgetCategoryOptions}
              secondarySelectValue={budgetTypeFilter}
              onSecondarySelectChange={setBudgetTypeFilter}
              secondarySelectLabel="Tipo"
              secondarySelectOptions={[
                { value: "all", label: "Todos los tipos" },
                { value: "planned", label: "Planificados" },
                { value: "fixed", label: "Fijos" },
                { value: "variable", label: "Variables" },
              ]}
              resultsCount={visibleBudgetItems}
              totalCount={totalBudgetItems}
              hasActiveFilters={hasActiveBudgetFilters}
              onClearFilters={() => {
                setBudgetSearch("");
                setBudgetSort("payment_asc");
                setBudgetFilter("all");
                setBudgetTypeFilter("all");
                setBudgetCategoryFilter("all");
              }}
              defaultExpanded
            />
          ) : null}

          <section
            className={`min-w-0 max-w-full overflow-hidden rounded-[32px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6 ${
              budgetView === "incomes" ? "" : "hidden"
            }`}
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Ingresos
                </p>
                <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
                  Entradas del mes
                </h2>
                <p className="mt-1 break-words text-sm text-slate-400">
                  Ingresos registrados y balance real del periodo.
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

            <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-[28px] border border-white/8 bg-black/20 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Total ingresos
                </p>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
                  {totalIncome.toFixed(2)} €
                </p>
              </div>
              <div
                className={`min-w-0 rounded-[28px] border border-white/8 bg-black/20 p-4 ${
                  monthlySummary.balance < 0 ? "text-red-300" : "text-emerald-300"
                }`}
              >
                <p className="break-words text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Balance real
                </p>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight">
                  {monthlySummary.balance.toFixed(2)} €
                </p>
              </div>
              <div className="min-w-0 rounded-[28px] border border-white/8 bg-black/20 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  Planificado
                </p>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
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

          <section
            className={`space-y-3 ${
              budgetView === "expenses" ? "" : "hidden"
            }`}
          >
            <div className="flex min-w-0 items-center justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Gastos planificados
                </p>
                <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white">
                  Control por partidas
                </h2>
              </div>
            </div>
            {filteredPlanned.length > 0 ? (
              <div className="space-y-3">
                {filteredPlanned.map((item) => {
                  const reversibleExpense = getQuickPayExpenseForItem(item, "planned");
                  const itemActionKey = `planned-${item.id}`;

                  return (
                  <BudgetItem
                    key={`planned-${item.id}`}
                    type="planned"
                    item={item}
                    icon="🛒"
                    isExpanded={expandedPlannedExpenseId === String(item.id)}
                    onToggle={(selectedItem) =>
                      setExpandedPlannedExpenseId((current) =>
                        current === String(selectedItem.id)
                          ? null
                          : String(selectedItem.id)
                      )
                    }
                    onQuickAddSubmit={handleQuickAddSubmit}
                    onQuickPayTotal={openQuickPayTotal}
                    onQuickRevertTotal={handleQuickRevertPlannedExpense}
                    canQuickRevert={Boolean(reversibleExpense)}
                    quickActionLoading={
                      activeQuickBudgetAction?.id === itemActionKey
                        ? activeQuickBudgetAction.type
                        : null
                    }
                    budgetYear={year}
                    budgetMonth={month}
                    onOpenDetails={openBudgetItemDetail}
                    payers={payers}
                    payersError={payersError}
                  />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                No hay partidas planificadas con estos filtros.
              </div>
            )}
          </section>

          {(recurring.length > 0 || variableExpenses.length > 0) &&
          budgetView === "expenses" ? (
            <section className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Fijos y variables
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Pagos del mes
                </h2>
              </div>
              <div className="space-y-3">
                {filteredRecurring.length > 0 || filteredVariableExpenses.length > 0 ? (
                  <>
                    {filteredRecurring.length > 0 ? (
                      <div className="space-y-3">
                        {filteredRecurring.map((item) => {
                          const reversibleExpense = getQuickPayExpenseForItem(item, "recurring");
                          const itemActionKey = `recurring-${item.id}`;

                          return (
                            <BudgetItem
                              key={`recurring-${item.id}`}
                              type="recurring"
                              item={item}
                              icon="🔁"
                              isExpanded={expandedRecurringExpenseId === String(item.id)}
                              onToggle={(selectedItem) =>
                                setExpandedRecurringExpenseId((current) =>
                                  current === String(selectedItem.id)
                                    ? null
                                    : String(selectedItem.id)
                                )
                              }
                              onQuickAddSubmit={handleQuickAddSubmit}
                              onQuickPayTotal={openQuickPayTotal}
                              onQuickRevertTotal={handleQuickRevertPlannedExpense}
                              canQuickRevert={Boolean(reversibleExpense)}
                              quickActionLoading={
                                activeQuickBudgetAction?.id === itemActionKey
                                  ? activeQuickBudgetAction.type
                                  : null
                              }
                              budgetYear={year}
                              budgetMonth={month}
                              onOpenDetails={openBudgetItemDetail}
                              payers={payers}
                              payersError={payersError}
                            />
                          );
                        })}
                      </div>
                    ) : null}

                    {filteredVariableExpenses.length > 0 ? (
                      <div className="space-y-3">
                        {filteredRecurring.length > 0 ? (
                          <p className="px-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                            Gastos variables
                          </p>
                        ) : null}
                        {filteredVariableExpenses.map((expense, index) => (
                          <VariableExpenseItem
                            key={getExpenseIdentity(expense, index)}
                            expense={expense}
                            categoryMap={expenseCategoryMap}
                          />
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                    No hay pagos del mes con estos filtros.
                  </div>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <div className={budgetView === "incomes" ? "space-y-6" : "hidden"}>
          <section className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  Salarios planificados
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Resolución mensual
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Confirma o ajusta los ingresos recurrentes del mes.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
                {canManagePlans ? <button
                  type="button"
                  onClick={() => {
                    setCreatePlanError(null);
                    setEditingIncomePlan(null);
                    setCreatePlanOpen(true);
                  }}
                  className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 sm:w-auto"
                >
                  + Crear salario recurrente
                </button> : null}
                {normalizedIncomePlanMonth.isClosed && (
                  <span className="self-start rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-300 sm:self-auto">
                    Mes cerrado
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {incomePlanMonthLoading ? (
                <p className="text-sm text-slate-400">Cargando salarios planificados...</p>
              ) : incomePlanMonthError ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  {incomePlanMonthError}
                </p>
              ) : normalizedIncomePlanMonth.items.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                  No hay salarios planificados para este mes.
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
                      canManage={canManagePlans}
                      disabled={!normalizedIncomePlanMonth.canResolve}
                      loadingAction={
                        activeIncomePlanAction?.id === item.plan_id
                          ? activeIncomePlanAction.type
                          : null
                      }
                      onConfirm={handleConfirmIncomePlan}
                      onEdit={(selectedItem) => {
                        setCreatePlanError(null);
                        setEditingIncomePlan(selectedItem);
                        setCreatePlanOpen(true);
                      }}
                      onDelete={handleDeleteIncomePlan}
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

          {unplannedExpensesTotal > 0 && (
            <section className="rounded-[32px] border border-amber-400/16 bg-amber-500/8 p-5 text-amber-100 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/70">
                Atención
              </p>
              <p className="mt-2 text-base font-medium">
                Gastos no planificados este mes:{" "}
                <strong>{unplannedExpensesTotal.toFixed(2)} €</strong>
              </p>
            </section>
          )}
        </div>
      </section>

      {canManagePlans ? <AdjustIncomePlanModal
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
      /> : null}

      {canManagePlans ? <CreateIncomePlanModal
        key={editingIncomePlan?.plan_id ? `edit-income-plan-${editingIncomePlan.plan_id}` : "create-income-plan"}
        isOpen={createPlanOpen}
        onClose={() => {
          setCreatePlanOpen(false);
          setCreatePlanError(null);
          setEditingIncomePlan(null);
        }}
        onSubmit={handleSaveIncomePlan}
        initialData={editingIncomePlan}
        budgetYear={year}
        budgetMonth={month}
        loading={createPlanLoading}
        error={createPlanError}
        title={editingIncomePlan ? "Editar ingreso planificado" : "Crear ingreso planificado"}
        subtitle={editingIncomePlan ? "Salario recurrente existente" : "Salario recurrente"}
        submitLabel={editingIncomePlan ? "Guardar cambios" : "Crear plan"}
      /> : null}

      <ExpenseDetailSheet
        isOpen={budgetDetailState.isOpen}
        title={
          budgetDetailState.item
            ? getBudgetItemLabel(budgetDetailState.item, budgetDetailState.type)
            : "Detalle del gasto"
        }
        subtitle={
          budgetDetailState.item
            ? getBudgetItemCategoryName(budgetDetailState.item)
            : null
        }
        amount={budgetDetailState.item?.planned_amount ?? null}
        meta={
          budgetDetailState.item
            ? [
                {
                  label: "Vista",
                  value:
                    budgetDetailState.type === "recurring"
                      ? "Gasto fijo"
                      : "Partida planificada",
                },
                {
                  label: "Pagado",
                  value: `${getPaidAmount(budgetDetailState.item).toFixed(2)} €`,
                },
                {
                  label: "Por pagar",
                  value: `${getPendingAmount(budgetDetailState.item).toFixed(2)} €`,
                },
                {
                  label: "Estado",
                  value: PAYMENT_STATUS_LABELS[getPaymentStatus(budgetDetailState.item)] || "Pendiente",
                },
                {
                  label: "Diferencia",
                  value: formatDifference(budgetDetailState.item.difference_amount),
                },
                ...(budgetDetailState.item?.payer_detail
                  ? [
                      {
                        label: "Pagador",
                        value: getPayerDisplayName(
                          budgetDetailState.item.payer_detail
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
        payments={budgetDetailState.payments}
        loading={budgetDetailState.loading}
        error={budgetDetailState.error}
        monthStatus={budgetDetailState.item}
        monthStatusLoading={
          monthStatusAction.loading &&
          Number(monthStatusAction.item?.id) === Number(budgetDetailState.item?.id)
        }
        onUpdateMonthStatus={(isCompleted) =>
          requestMonthStatusUpdate(
            budgetDetailState.item,
            budgetDetailState.type,
            isCompleted
          )
        }
        emptyMessage="Este elemento aún no tiene pagos vinculados."
        onClose={closeBudgetItemDetail}
        onEditPayment={isMonthCompleted(budgetDetailState.item) ? undefined : (payment) => {
          setBudgetPaymentFormError(null);
          setEditingBudgetPayment(payment);
        }}
        onDeletePayment={isMonthCompleted(budgetDetailState.item) ? undefined : handleDeleteBudgetPayment}
        getPaymentCategoryLabel={(payment) => getBudgetExpenseCategoryName(payment)}
      />

      <ExpenseFormModal
        key={editingBudgetPayment?.id ?? "budget-payment-form"}
        isOpen={Boolean(editingBudgetPayment)}
        expense={editingBudgetPayment}
        categories={expenseCategories}
        payers={payers}
        payersError={payersError}
        loading={budgetPaymentFormLoading}
        error={budgetPaymentFormError}
        onClose={() => {
          if (budgetPaymentFormLoading) return;
          setEditingBudgetPayment(null);
          setBudgetPaymentFormError(null);
        }}
        onSubmit={handleSaveBudgetPayment}
      />

      <ConfirmationModal
        isOpen={Boolean(monthStatusAction.item)}
        title={monthStatusAction.isCompleted ? "¿Cerrar el pago de este mes?" : "¿Reabrir este pago?"}
        description={
          monthStatusAction.isCompleted
            ? `Ya no aparecerá importe pendiente para ${monthLabel.toLowerCase()}, aunque el pago real sea menor que el planificado. Podrás reabrirlo después.`
            : `Volverá a mostrarse como pendiente cualquier diferencia entre lo planificado y lo pagado en ${monthLabel.toLowerCase()}.`
        }
        confirmLabel={monthStatusAction.isCompleted ? "Cerrar pago del mes" : "Reabrir pago"}
        loading={monthStatusAction.loading}
        error={monthStatusAction.error}
        onCancel={() => {
          if (monthStatusAction.loading) return;
          setMonthStatusAction({ item: null, type: null, isCompleted: null, loading: false, error: null });
        }}
        onConfirm={confirmMonthStatusUpdate}
      />

      <QuickPayTotalModal
        key={
          quickPayTotalState.item
            ? `quick-pay-${quickPayTotalState.type}-${quickPayTotalState.item.id}`
            : "quick-pay-closed"
        }
        isOpen={quickPayTotalState.isOpen}
        item={quickPayTotalState.item}
        title={
          quickPayTotalState.item
            ? getBudgetItemLabel(quickPayTotalState.item, quickPayTotalState.type)
            : ""
        }
        amount={quickPayTotalState.item?.planned_amount ?? 0}
        defaultPayer={quickPayTotalState.item?.payer ?? ""}
        payers={payers}
        payersError={payersError}
        loading={activeQuickBudgetAction?.type === "pay"}
        error={quickPayTotalState.error}
        onClose={closeQuickPayTotal}
        onSubmit={handleQuickPayTotalSubmit}
      />

      <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
    </div>
  );
}
