import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../services/categories";
import { getApiErrorMessage } from "../services/api";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getIncomeCategories(categories) {
  return categories.filter((cat) => {
    if (cat?.is_income === true) return true;
    if (cat?.kind === "income" || cat?.type === "income") return true;
    if (cat?.transaction_type === "income" || cat?.movement_type === "income") {
      return true;
    }
    if (
      cat?.is_income === false ||
      cat?.kind === "expense" ||
      cat?.type === "expense" ||
      cat?.transaction_type === "expense" ||
      cat?.movement_type === "expense"
    ) {
      return false;
    }
    return true;
  });
}

export default function CreateIncomePlanModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  budgetYear,
  budgetMonth,
  loading = false,
  error = null,
  title = "Crear ingreso planificado",
  subtitle = "Salario recurrente",
  submitLabel = "Crear plan",
}) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [form, setForm] = useState({
    categoryId: initialData?.category ? String(initialData.category) : "",
    name: initialData?.name || "",
    amount: initialData?.planned_amount || "",
    planType: initialData?.plan_type || "ONGOING",
    dueDay: initialData?.due_day || "",
  });

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[budgetMonth - 1]} ${budgetYear}`,
    [budgetMonth, budgetYear]
  );

  const incomeCategories = useMemo(
    () => getIncomeCategories(categories),
    [categories]
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const data = await getCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setCategoriesError(
            getApiErrorMessage(err, "No se pudieron cargar las categorías")
          );
        }
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      categoryId: form.categoryId,
      name: form.name,
      amount: form.amount,
      planType: form.planType,
      dueDay: form.dueDay,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full rounded-[32px] border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Salario recurrente</p>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500">
              {subtitle} · Mes: {monthLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200">
              Categoría
            </label>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({ ...current, categoryId: event.target.value }))
              }
              required
              disabled={categoriesLoading}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Selecciona una categoría</option>
              {incomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Nombre del ingreso
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ej: Nómina mensual"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Importe planificado
              </label>
              <input
                type="text"
                inputMode="decimal"
                min="0"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Día de cobro
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueDay: event.target.value }))
                }
                placeholder="30"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200">
              Tipo de plan
            </label>
            <select
              value={form.planType}
              onChange={(event) =>
                setForm((current) => ({ ...current, planType: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
            >
              <option value="ONGOING">Recurrente</option>
              <option value="ONE_MONTH">Solo este mes</option>
            </select>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
            El plan se crea para el mes seleccionado y luego aparecerá en la resolución mensual
            de ingresos recurrentes. Los ingresos manuales seguirán siendo ingresos puntuales.
          </div>

          {categoriesError && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {categoriesError}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {categoriesLoading && (
            <p className="text-sm text-slate-400">Cargando categorías...</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="flex-1 rounded-2xl bg-emerald-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {loading ? "Guardando..." : submitLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
