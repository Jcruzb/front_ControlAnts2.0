import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        const data = await api.get("/expenses/", {
          params: { year, month },
        });

        setExpenses(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los gastos");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  console.log(expenses)

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Cargando gastos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Gastos del mes
        </h1>
        <p className="text-sm text-gray-500">
          Resumen y detalle de tus gastos
        </p>
      </header>

      {/* Monthly summary */}
      <div className="rounded-2xl bg-white border p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Total del mes</p>
          <p className="text-2xl font-bold text-red-600">
            − {totalAmount.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-gray-500 border">
          No hay gastos registrados este mes.
        </div>
      )}

      {/* Expenses list */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="rounded-2xl bg-white p-4 border shadow-sm flex items-center justify-between gap-4"
          >
            <div className="flex-1 space-y-1">
              <p className="font-medium text-gray-900 truncate">
                {expense.is_recurring === true && <span className="mr-1 text-gray-400">🔁</span>}
                {expense.description || "Gasto"}
              </p>
              <p className="text-sm text-gray-500">
                {expense.category || "Sin categoría"}
              </p>
              <p className="text-xs text-gray-400">
                {expense.date}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-lg font-semibold text-red-600">
                − {Number(expense.amount).toFixed(2)} €
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExpensesList;