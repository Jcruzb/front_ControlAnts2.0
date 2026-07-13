import api, { unwrapCollectionResponse } from "./api";

/**
 * Planned Expense Plans (new system)
 * Endpoint: /api/planned-expense-plans/
 */

export const getPlannedExpensePlans = async () => {
  return unwrapCollectionResponse(await api.get("planned-expense-plans/"));
};

export const createPlannedExpensePlan = (payload) => {
  /**
   * payload example:
   * {
   *   category: 1,
   *   name: "Supermercado",
   *   plan_type: "ONGOING" | "ONE_MONTH",
   *   start_month: 12,
   *   planned_amount: 200,
   * }
   */
  return api.post("planned-expense-plans/", payload);
};

export const updatePlannedExpensePlan = (id, payload) => {
  /**
   * payload example:
   * {
   *   name?: string,
   *   active?: boolean,
   *   end_month?: number,
   *   planned_amount?: number, // creates a NEW version
   *   effective_month?: number, // required when planned_amount changes
   * }
   */
  return api.patch(`planned-expense-plans/${id}/`, payload);
};

export const deactivatePlannedExpensePlan = (id) => {
  return api.post(`planned-expense-plans/${id}/deactivate/`);
};

export const reactivatePlannedExpensePlan = (id) => {
  return api.post(`planned-expense-plans/${id}/reactivate/`);
};

export const updatePlannedExpensePlanMonthStatus = (
  id,
  year,
  month,
  isCompleted
) => {
  return api.patch(
    `planned-expense-plans/${id}/month-status/`,
    { is_completed: isCompleted },
    { params: { year, month } }
  );
};

export const updateLegacyPlannedExpenseMonthStatus = (
  id,
  year,
  month,
  isCompleted
) => {
  return api.patch(
    `planned-expenses/${id}/month-status/`,
    { is_completed: isCompleted },
    { params: { year, month } }
  );
};
