export const PAYMENT_STATUS_LABELS = {
  pending: "Pendiente",
  partially_paid: "Parcialmente pagado",
  covered: "Pagado",
  exceeded: "Presupuesto superado",
  completed: "Completado",
};

export function getPaidAmount(item) {
  return Number(item?.paid_amount ?? item?.spent_amount ?? 0);
}

export function getPendingAmount(item) {
  return Number(item?.pending_amount ?? item?.remaining_amount ?? 0);
}

export function getPaymentStatus(item) {
  return item?.payment_status || (item?.is_completed === true ? "completed" : "pending");
}

export function isMonthCompleted(item) {
  return item?.is_completed === true || item?.payment_status === "completed";
}

export function mergeMonthStatus(item, monthStatus) {
  const { id: occurrenceId, ...statusFields } = monthStatus || {};
  return {
    ...item,
    ...statusFields,
    occurrence_id: occurrenceId,
  };
}

export function formatDifference(value) {
  const amount = Number(value ?? 0);
  if (amount > 0) return `${amount.toFixed(2)} € menos de lo planificado`;
  if (amount < 0) return `${Math.abs(amount).toFixed(2)} € por encima de lo planificado`;
  return "Coincide con lo planificado";
}

export function isRecurringExpenseMonthCompleted(expense) {
  const monthStatus = expense?.recurring_payment_month;
  return Boolean(
    monthStatus &&
      (monthStatus.is_completed === true || monthStatus.payment_status === "completed")
  );
}

export function getExpensePaymentMonthStatus(expense) {
  return expense?.recurring_payment_month || expense?.planned_payment_month || null;
}

export function isExpenseMonthCompleted(expense) {
  return isMonthCompleted(getExpensePaymentMonthStatus(expense));
}

export function isCompletedMonthConflict(error) {
  if (error?.response?.status !== 400) return false;
  const data = error?.response?.data;
  const text = typeof data === "string" ? data : JSON.stringify(data || {});
  return /completad|cerrad|reabr/i.test(text);
}
