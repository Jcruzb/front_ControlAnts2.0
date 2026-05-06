import { useEffect, useMemo, useState } from "react";
import api, {
  getApiErrorMessage,
} from "../services/api";
import { getCategories } from "../services/categories";
import AddCategoryModal from "./AddCategoryModal";
import { getTodayLocalDate } from "../utils/date";
import { parseAmount } from "../utils/amounts";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getDefaultIncomeDate(year, month) {
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return getTodayLocalDate();
  }
  const lastDay = getLastDayOfMonth(year, month);
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(
    2,
    "0"
  )}`;
}

export default function QuickAddIncome({
  year,
  month,
  onCreated,
  onSaved,
  income = null,
  open,
  onOpenChange,
  buttonLabel = "+ Añadir ingreso",
  buttonClassName = "rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1]",
}) {
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    categoryId: "",
    description: "",
    date: "",
  });

  const isOpen = isControlled ? open : internalOpen;

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[month - 1]} ${year}`,
    [month, year]
  );

  const minDate = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}-01`,
    [year, month]
  );

  const maxDate = useMemo(() => {
    const last = getLastDayOfMonth(year, month);
    return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(
      2,
      "0"
    )}`;
  }, [year, month]);

  const incomeCategories = useMemo(
    () =>
      categories.filter((cat) => {
        if (cat?.is_income === true) return true;
        if (cat?.kind === "income" || cat?.type === "income") return true;
        if (
          cat?.transaction_type === "income" ||
          cat?.movement_type === "income"
        ) {
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
      }),
    [categories]
  );

  async function fetchCategories() {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await getCategories();
      setCategories(res);
    } catch (err) {
      console.error(err);
      setCategoriesError(
        getApiErrorMessage(err, "No se pudo cargar las categorías")
      );
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      amount: income?.amount !== undefined && income?.amount !== null ? String(income.amount) : "",
      categoryId:
        income?.category !== undefined && income?.category !== null
          ? String(income.category)
          : "",
      description: income?.description || "",
      date: income?.date || getDefaultIncomeDate(year, month),
    });

    fetchCategories();
  }, [income, isOpen, year, month]);

  function resetAndClose() {
    setError(null);
    setSaving(false);
    setShowAddCategory(false);
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
    setForm({
      amount: "",
      categoryId: "",
      description: "",
      date: getDefaultIncomeDate(year, month),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const amountNum = parseAmount(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Introduce un importe válido mayor que 0");
      return;
    }
    if (!form.categoryId) {
      setError("Debe seleccionar una categoría");
      return;
    }
    if (!form.date) {
      setError("Debe seleccionar una fecha");
      return;
    }
    if (form.date < minDate || form.date > maxDate) {
      setError("La fecha debe estar dentro del mes seleccionado");
      return;
    }

    const payload = {
      amount: amountNum,
      date: form.date,
      description: form.description || "",
      category: form.categoryId,
    };

    try {
      setSaving(true);
      if (income?.id) {
        await api.patch(`/incomes/${income.id}/`, payload);
      } else {
        await api.post("/incomes/", payload);
      }
      resetAndClose();
      if (onSaved) await onSaved();
      else if (onCreated) await onCreated();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Error al guardar el ingreso"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {!isControlled && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setForm({
              amount: "",
              categoryId: "",
              description: "",
              date: getDefaultIncomeDate(year, month),
            });
            setInternalOpen(true);
          }}
          className={buttonClassName}
        >
          {buttonLabel}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0d1117] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">Ingreso puntual</p>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {income?.id ? "Editar ingreso" : "Añadir ingreso"}
                </h3>
                <p className="text-xs text-slate-500">Mes: {monthLabel}</p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Importe (€)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  min="0"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-200">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="text-xs font-medium text-emerald-300 transition hover:text-emerald-200"
                  >
                    + Nueva categoría
                  </button>
                </div>

                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  required
                  disabled={categoriesLoading}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
                >
                  <option value="">-- Seleccionar categoría --</option>
                  {incomeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </option>
                  ))}
                </select>

                {!categoriesLoading &&
                  incomeCategories.length === 0 &&
                  !categoriesError && (
                    <p className="mt-2 text-xs text-amber-200">
                      No hay categorías disponibles para registrar ingresos.
                    </p>
                  )}

                {categoriesError && (
                  <p className="mt-2 text-xs text-red-300">{categoriesError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/50"
                  placeholder="Ej: Consultoría, devolución, bonus…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Fecha
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50"
                />
                <p className="mt-2 text-[11px] text-slate-500">
                  Solo se permiten fechas dentro del mes seleccionado.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-emerald-400 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : income?.id ? "Guardar cambios" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          {showAddCategory && (
            <AddCategoryModal
              onClose={() => setShowAddCategory(false)}
              onCreated={(newCat) => {
                // aparece al instante + se selecciona
                setCategories((prev) => [newCat, ...prev]);
                setForm((f) => ({ ...f, categoryId: String(newCat.id) }));
                setShowAddCategory(false);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
