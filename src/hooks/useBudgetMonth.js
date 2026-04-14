import { useContext } from "react";
import { BudgetMonthContext } from "../context/budget-month-context";

export function useBudgetMonth() {
  const context = useContext(BudgetMonthContext);

  if (!context) {
    throw new Error("useBudgetMonth must be used within a BudgetMonthProvider");
  }

  return context;
}
