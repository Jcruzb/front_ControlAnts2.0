import { useState } from "react";
import { BudgetMonthContext, MONTH_NAMES } from "./budget-month-context";

export function BudgetMonthProvider({ children }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const goPrevMonth = () => {
    if (month === 1) {
      setYear((current) => current - 1);
      setMonth(12);
      return;
    }

    setMonth((current) => current - 1);
  };

  const goNextMonth = () => {
    if (month === 12) {
      setYear((current) => current + 1);
      setMonth(1);
      return;
    }

    setMonth((current) => current + 1);
  };

  const resetToCurrentMonth = () => {
    const currentDate = new Date();
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth() + 1);
  };

  return (
    <BudgetMonthContext.Provider
      value={{
        year,
        month,
        setYear,
        setMonth,
        goPrevMonth,
        goNextMonth,
        resetToCurrentMonth,
        monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
        monthNames: MONTH_NAMES,
        currentYear: new Date().getFullYear(),
        currentMonth: new Date().getMonth() + 1,
      }}
    >
      {children}
    </BudgetMonthContext.Provider>
  );
}
