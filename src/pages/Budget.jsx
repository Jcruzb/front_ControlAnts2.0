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
import { useBudgetMonth } from "../hooks/useBudgetMonth";
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
import { parseAmount } from "../utils/amounts";
import { getTodayLocalDate } from "../utils/date";
import { getPayerDisplayName } from "../utils/payers";

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

function getBudgetPaymentState(item) {
  const planned = Number(item?.planned_amount || 0);
  const spent = Number(item?.spent_amount || 0);

  if (spent <= 0) return "unpaid";
  if (planned > 0 && spent >= planned) return "paid";
  return "partial";
}

function getBudgetPaymentStateLabel(state) {
  switch (state) {
    case "unpaid":
      return "Sin pagar";
    case "partial":
      return "En pago";
    case "paid":
      return "Pagado";
    default:
      return "Todos";
  }
}

function getBudgetPaymentStateRank(state) {
  switch (state) {
    case "unpaid":
      return 0;
    case "partial":
      return 1;
    case "paid":
      return 2;
    default:
      return 3;
  }
}

const EMPTY_BUDGET = {
  status: "ok",
  remaining_amount: 0,
  total_planned: 0,
  planned: [],
  recurring: [],
  unplanned_total: 0,
};

function MetricLabel({ children, help }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-500">
      <span>{children}</span>
      <InfoTooltip label={help}>
        {help}
      </InfoTooltip>
    </div>
  );
}

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
        plannedExpenseId: type === "planned" ? item.id : null,
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
        type === "planned" ? expense?.planned_expense : expense?.recurring_payment;
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
        (expense) => Number(expense?.planned_expense) === Number(item.id)
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

  const totalSpentFromBudget = Number(data?.total_spent || 0);
  const totalSpentFromExpenses = useMemo(() => {
    return budgetExpenses.reduce(
      (sum, expense) => sum + Number(expense?.amount || 0),
      0
    );
  }, [budgetExpenses]);

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

  const totalIncomeWithRecurring = totalIncome + plannedRecurringIncome;
  const totalSpentReal =
    budgetExpenses.length > 0 ? totalSpentFromExpenses : totalSpentFromBudget;
  const balanceReal = totalIncomeWithRecurring - totalSpentReal;
  const selectedMonthId = data?.month_id ?? data?.income_plan_month?.month_id ?? null;
  const budgetData = data ?? EMPTY_BUDGET;
  const {
    status,
    remaining_amount,
    total_planned,
    planned,
    recurring,
    unplanned_total,
  } = budgetData;
  const totalPlannedAmount = Number(total_planned || 0);
  const plannedBalance = totalIncomeWithRecurring - totalPlannedAmount;
  const plannedBalanceState =
    plannedBalance > 0
      ? "Excedente planificado"
      : plannedBalance < 0
      ? "Faltante planificado"
      : "Equilibrio planificado";
  const plannedBalanceLoading =
    incomesLoading || (incomePlanMonthLoading && !data?.income_plan_month);
  const plannedBalanceTone =
    plannedBalanceLoading
      ? "border-white/10 bg-white/[0.04] text-slate-300"
      : plannedBalance > 0
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : plannedBalance < 0
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-blue-400/20 bg-blue-500/10 text-blue-200";
  const plannedBalanceText = plannedBalanceLoading
    ? "Calculando..."
    : `${plannedBalanceState}: ${plannedBalance.toFixed(2)} €`;

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

    return [
      { value: "all", label: "Todas las categorias" },
      ...Array.from(categoryMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    ];
  }, [planned, recurring]);

  const filteredPlanned = useMemo(() => {
    const normalizedSearch = budgetSearch.trim().toLowerCase();

    return [...planned]
      .filter((item) => {
        const paymentState = getBudgetPaymentState(item);
        const matchesFilter =
          budgetFilter === "all" || budgetFilter === paymentState;
        const matchesCategory =
          budgetCategoryFilter === "all" ||
          getBudgetItemCategoryValue(item) === budgetCategoryFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          getBudgetItemSearchText(item, "planned").includes(normalizedSearch);

        return matchesFilter && matchesCategory && matchesSearch;
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
  }, [budgetCategoryFilter, budgetFilter, budgetSearch, budgetSort, planned]);

  const filteredRecurring = useMemo(() => {
    const normalizedSearch = budgetSearch.trim().toLowerCase();

    return [...recurring]
      .filter((item) => {
        const paymentState = getBudgetPaymentState(item);
        const matchesFilter =
          budgetFilter === "all" || budgetFilter === paymentState;
        const matchesCategory =
          budgetCategoryFilter === "all" ||
          getBudgetItemCategoryValue(item) === budgetCategoryFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          getBudgetItemSearchText(item, "recurring").includes(normalizedSearch);

        return matchesFilter && matchesCategory && matchesSearch;
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
  }, [budgetCategoryFilter, budgetFilter, budgetSearch, budgetSort, recurring]);

  const visibleBudgetItems = filteredPlanned.length + filteredRecurring.length;
  const totalBudgetItems = planned.length + recurring.length;
  const hasActiveBudgetFilters =
    budgetSearch.trim().length > 0 ||
    budgetSort !== "payment_asc" ||
    budgetFilter !== "all" ||
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

  const displayStatus = balanceReal < 0 ? "over" : status;
  const statusText =
    displayStatus === "over"
      ? "Te has pasado este mes"
      : displayStatus === "warning"
      ? "Ojo, estás cerca del límite"
      : "Vas bien este mes";

  const statusColor =
    displayStatus === "over"
      ? "text-red-300"
      : displayStatus === "warning"
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
              <div
                className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${plannedBalanceTone}`}
                title="Balance planificado: ingresos previstos menos gastos planificados del mes."
              >
                {plannedBalanceText}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <MetricLabel help="Ingresos planificados y registrados para este mes. Incluye ingresos reales y recurrentes pendientes de confirmar.">
                  Ingresos
                </MetricLabel>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalIncomeWithRecurring.toFixed(0)} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <MetricLabel help="Gastos planificados para este mes: partidas previstas y gastos fijos incluidos en el presupuesto.">
                  Planificado
                </MetricLabel>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalPlannedAmount.toFixed(0)} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <MetricLabel help="Gastos ya registrados como pagados durante este mes.">
                  Pagado
                </MetricLabel>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  {totalSpentReal.toFixed(2)} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <MetricLabel help="Importe planificado que todavía queda pendiente por pagar este mes.">
                  Por pagar
                </MetricLabel>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${statusColor}`}>
                  {remaining_amount} €
                </p>
              </div>
              <div className="rounded-[28px] border border-white/8 bg-black/20 px-4 py-4">
                <MetricLabel help="Balance real del mes: ingresos menos todos los gastos registrados, incluyendo gastos planificados, recurrentes y gastos no planificados.">
                  Balance
                </MetricLabel>
                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${
                    balanceReal >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {balanceReal.toFixed(2)} €
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
                { value: "unpaid", label: getBudgetPaymentStateLabel("unpaid") },
                { value: "partial", label: getBudgetPaymentStateLabel("partial") },
                { value: "paid", label: getBudgetPaymentStateLabel("paid") },
              ]}
              extraSelectValue={budgetCategoryFilter}
              onExtraSelectChange={setBudgetCategoryFilter}
              extraSelectLabel="Categoria"
              extraSelectOptions={budgetCategoryOptions}
              resultsCount={visibleBudgetItems}
              totalCount={totalBudgetItems}
              hasActiveFilters={hasActiveBudgetFilters}
              onClearFilters={() => {
                setBudgetSearch("");
                setBudgetSort("payment_asc");
                setBudgetFilter("all");
                setBudgetCategoryFilter("all");
              }}
              defaultExpanded
            />
          ) : null}

          <section
            className={`rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] ${
              budgetView === "incomes" ? "" : "hidden"
            }`}
          >
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
                  {totalIncomeWithRecurring.toFixed(2)} €
                </p>
              </div>
              <div
                className={`rounded-[28px] border border-white/8 bg-black/20 p-4 ${
                  balanceReal < 0 ? "text-red-300" : "text-emerald-300"
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Balance
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {balanceReal.toFixed(2)} €
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

          <section
            className={`space-y-3 ${
              budgetView === "expenses" ? "" : "hidden"
            }`}
          >
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

          {recurring.length > 0 && budgetView === "expenses" ? (
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
                {filteredRecurring.length > 0 ? (
                  filteredRecurring.map((item) => {
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
                  })
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">
                    No hay gastos fijos con estos filtros.
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
                <button
                  type="button"
                  onClick={() => {
                    setCreatePlanError(null);
                    setEditingIncomePlan(null);
                    setCreatePlanOpen(true);
                  }}
                  className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 sm:w-auto"
                >
                  + Crear salario recurrente
                </button>
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

      <CreateIncomePlanModal
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
      />

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
                  label: "Usado",
                  value: `${Number(
                    budgetDetailState.item.spent_amount || 0
                  ).toFixed(2)} €`,
                },
                {
                  label: "Restante",
                  value: `${Number(
                    budgetDetailState.item.remaining_amount || 0
                  ).toFixed(2)} €`,
                },
                {
                  label: "Estado",
                  value: getBudgetPaymentStateLabel(
                    getBudgetPaymentState(budgetDetailState.item)
                  ),
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
        emptyMessage="Este elemento aún no tiene pagos vinculados."
        onClose={closeBudgetItemDetail}
        onEditPayment={(payment) => {
          setBudgetPaymentFormError(null);
          setEditingBudgetPayment(payment);
        }}
        onDeletePayment={handleDeleteBudgetPayment}
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
