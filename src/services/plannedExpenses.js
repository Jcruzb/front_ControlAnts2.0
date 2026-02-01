import api from "./api";

/**
 * Planned Expense Plans (new system)
 * Endpoint: /api/planned-expense-plans/
 */

export const getPlannedExpensePlans = () => {
  return api.get("planned-expense-plans/");
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
