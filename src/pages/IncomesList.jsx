import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, {
  getApiErrorMessage,
  unwrapCollectionResponse,
} from "../services/api";
import MonthNavigation from "../components/MonthNavigation";
import QuickAddIncome from "../components/QuickAddIncome";
import ListControls from "../components/ListControls";
import BulkImportModal from "../components/BulkImportModal";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import { getCategories } from "../services/categories";
import { getTodayLocalDate } from "../utils/date";
import {
  buildCategoryLookup,
  downloadWorkbook,
  isSpreadsheetRowEmpty,
  normalizeText,
  parsePositiveAmount,
  parseSpreadsheetDate,
  readSpreadsheetRows,
} from "../utils/spreadsheet";

function normalizeIncomeCategory(income) {
  return income?.category_detail ?? null;
}

function getIncomeCategoryName(income) {
  return normalizeIncomeCategory(income)?.name || "Sin categoría";
}

function getIncomeCategoryColor(income) {
  return normalizeIncomeCategory(income)?.color || "#22c55e";
}

function getIncomeIconLabel(income) {
  const icon = normalizeIncomeCategory(income)?.icon;

  if (!icon || typeof icon !== "string") {
    return "€";
  }

  if (icon.length <= 2) {
    return icon;
  }

  return icon.slice(0, 1).toUpperCase();
}

function IncomeCard({ income, categoryColor, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    }

    if (showActions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-[30px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] md:flex-row md:items-center md:justify-between md:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
          style={{ backgroundColor: categoryColor }}
        >
          {getIncomeIconLabel(income)}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-base font-semibold text-white">
              {getIncomeCategoryName(income)}
            </h2>
            <span
              className="rounded-full px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${categoryColor}22`,
                color: categoryColor,
              }}
            >
              {income.date}
            </span>
          </div>

          <p className="break-words text-sm text-slate-400">
            {income.description || "Sin descripción"}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 md:ml-auto md:w-auto md:items-end">
        <div className="flex items-start justify-between gap-3 md:justify-start">
          <div className="min-w-0 text-left md:text-right">
            <p className="text-xl font-semibold text-emerald-300">
              + {Number(income.amount).toFixed(2)} €
            </p>
            {income.created_at && (
              <p className="break-words text-xs text-slate-500">
                Creado: {new Date(income.created_at).toLocaleString("es-ES")}
              </p>
            )}
          </div>

          <div className="relative" ref={actionsRef}>
            <button
              type="button"
              onClick={() => setShowActions((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Abrir opciones"
            >
              ⋯
            </button>

            {showActions && (
              <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#11161d] shadow-[0_24px_50px_rgba(0,0,0,0.45)]">
                <button
                  type="button"
                  onClick={() => {
                    setShowActions(false);
                    onEdit(income);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowActions(false);
                    onDelete(income);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function IncomesList() {
  const {
    currentYear,
    goNextMonth,
    goPrevMonth,
    month,
    monthNames,
    resetToCurrentMonth,
    setMonth,
    setYear,
    year,
  } = useBudgetMonth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, categoriesData] = await Promise.all([
        api.get("/incomes/", {
          params: { year, month },
        }),
        getCategories(),
      ]);

      setIncomes(unwrapCollectionResponse(data));
      setCategories(categoriesData);
    } catch (fetchError) {
      console.error(fetchError);
      setError(getApiErrorMessage(fetchError, "No se pudieron cargar los ingresos"));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const totalAmount = useMemo(() => {
    return incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
  }, [incomes]);

  const incomeCategories = useMemo(
    () =>
      categories.filter((category) => {
        if (category?.is_income === true) return true;
        if (category?.kind === "income" || category?.type === "income") return true;
        if (
          category?.transaction_type === "income" ||
          category?.movement_type === "income"
        ) {
          return true;
        }
        if (
          category?.is_income === false ||
          category?.kind === "expense" ||
          category?.type === "expense" ||
          category?.transaction_type === "expense" ||
          category?.movement_type === "expense"
        ) {
          return false;
        }

        return true;
      }),
    [categories]
  );

  const incomeCategoryLookup = useMemo(
    () => buildCategoryLookup(incomeCategories),
    [incomeCategories]
  );

  const filteredIncomes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = incomes.filter((income) => {
      const categoryName = getIncomeCategoryName(income).toLowerCase();
      const description = String(income.description || "").toLowerCase();

      return (
        normalizedSearch.length === 0 ||
        categoryName.includes(normalizedSearch) ||
        description.includes(normalizedSearch)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return getIncomeCategoryName(a).localeCompare(getIncomeCategoryName(b), "es");
        case "name_desc":
          return getIncomeCategoryName(b).localeCompare(getIncomeCategoryName(a), "es");
        case "amount_asc":
          return Number(a.amount || 0) - Number(b.amount || 0);
        case "amount_desc":
          return Number(b.amount || 0) - Number(a.amount || 0);
        case "date_asc":
          return new Date(a.date || a.created_at || 0) - new Date(b.date || b.created_at || 0);
        case "date_desc":
        default:
          return new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0);
      }
    });

    return result;
  }, [incomes, search, sortBy]);

  const hasActiveFilters = search.trim().length > 0 || sortBy !== "date_desc";

  async function downloadIncomeTemplate() {
    await downloadWorkbook("plantilla-ingresos.xlsx", [
      {
        name: "Ingresos",
        data: [
          {
            descripcion: "Nomina abril",
            importe: "1850.00",
            categoria: incomeCategories[0]?.name || "Nomina",
            fecha: getTodayLocalDate(),
          },
        ],
        columns: [30, 14, 24, 16],
      },
      {
        name: "Categorias",
        data: incomeCategories.map((category) => ({
          categoria: category.name,
          icono: category.icon || "",
        })),
        columns: [28, 10],
      },
      {
        name: "Instrucciones",
        type: "aoa",
        data: [
          ["Campo", "Descripcion"],
          ["descripcion", "Texto libre del ingreso"],
          ["importe", "Numero positivo. Ejemplo: 1850.00"],
          ["categoria", "Nombre exacto de una categoria de ingreso"],
          ["fecha", "Formato recomendado: YYYY-MM-DD"],
        ],
        columns: [18, 48],
      },
    ]);
  }

  async function downloadExistingIncomes() {
    await downloadWorkbook("ingresos-existentes.xlsx", [
      {
        name: "Ingresos",
        data: incomes.map((income) => ({
          descripcion: income.description || "",
          importe:
            income.amount !== null && income.amount !== undefined
              ? Number(income.amount).toFixed(2)
              : "",
          categoria: getIncomeCategoryName(income),
          fecha: income.date || "",
        })),
        columns: [30, 14, 24, 16],
      },
      {
        name: "Categorias",
        data: incomeCategories.map((category) => ({
          categoria: category.name,
          icono: category.icon || "",
        })),
        columns: [28, 10],
      },
      {
        name: "Resumen",
        type: "aoa",
        data: [
          ["Concepto", "Valor"],
          ["Total ingresos", String(incomes.length)],
          ["Total importe", totalAmount.toFixed(2)],
          ["Categorias activas", String(new Set(incomes.map((income) => income.category)).size)],
        ],
        columns: [22, 14],
      },
    ]);
  }

  async function parseIncomeFile(file) {
    const rawRows = await readSpreadsheetRows(file);
    const rows = [];
    const errors = [];

    for (const [index, rawRow] of rawRows.entries()) {
      if (isSpreadsheetRowEmpty(rawRow)) {
        continue;
      }

      const rowNumber = index + 2;
      const normalizedRow = Object.entries(rawRow).reduce((acc, [key, value]) => {
        acc[normalizeText(key)] = value;
        return acc;
      }, {});

      const description = String(
        normalizedRow.descripcion ||
          normalizedRow.description ||
          normalizedRow.concepto ||
          ""
      ).trim();
      const amount = parsePositiveAmount(
        normalizedRow.importe || normalizedRow.amount || normalizedRow.monto
      );
      const categoryValue = String(
        normalizedRow.categoria || normalizedRow.category || ""
      ).trim();
      const date = await parseSpreadsheetDate(
        normalizedRow.fecha || normalizedRow.date || normalizedRow.dia
      );
      const category = incomeCategoryLookup.get(normalizeText(categoryValue));

      if (!description) {
        errors.push(`Fila ${rowNumber}: la descripcion es obligatoria.`);
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push(`Fila ${rowNumber}: el importe debe ser mayor que 0.`);
      }

      if (!category) {
        errors.push(
          `Fila ${rowNumber}: la categoria de ingreso "${categoryValue || "vacia"}" no existe.`
        );
      }

      if (!date) {
        errors.push(`Fila ${rowNumber}: la fecha no es valida.`);
      }

      if (!description || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
        continue;
      }

      rows.push({
        previewKey: `income-${rowNumber}`,
        description,
        amount: amount.toFixed(2),
        categoryName: category.name,
        date,
        payload: {
          description,
          amount,
          category: category.id,
          date,
        },
      });
    }

    return { rows, errors };
  }

  async function saveBulkIncomes(rows) {
    for (const [index, row] of rows.entries()) {
      try {
        await api.post("/incomes/", row.payload);
      } catch (saveError) {
        throw new Error(
          `La fila ${index + 1} de la vista previa fallo al guardar: ${getApiErrorMessage(
            saveError,
            "No se pudo crear el ingreso"
          )}`
        );
      }
    }

    await fetchIncomes();
    setBulkImportMessage(
      `Se importaron ${rows.length} ingresos correctamente.`
    );
  }

  async function handleDeleteIncome(income) {
    const incomeLabel =
      income.description || getIncomeCategoryName(income) || "este ingreso";

    if (
      !window.confirm(`¿Eliminar ${incomeLabel}? Esta acción no se puede deshacer.`)
    ) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/incomes/${income.id}/`);
      await fetchIncomes();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getApiErrorMessage(deleteError, "No se pudo eliminar el ingreso"));
    }
  }

  return (
    <section className="space-y-8">
      <header className="flex min-w-0 flex-col gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Ingresos
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Ingresos</h1>
          <p className="text-sm text-slate-400">
            Registro mensual de entradas de dinero de la familia.
          </p>
        </div>

        <div className="w-full min-w-0">
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
            compact
          />
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={downloadExistingIncomes}
            disabled={incomes.length === 0}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Exportar existentes
          </button>
          <button
            type="button"
            onClick={downloadIncomeTemplate}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] sm:w-auto"
          >
            Descargar plantilla
          </button>
          <button
            type="button"
            onClick={() => setBulkImportOpen(true)}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 sm:w-auto"
          >
            Importar Excel
          </button>
          <QuickAddIncome
            year={year}
            month={month}
            onCreated={fetchIncomes}
            buttonClassName="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.1] sm:w-auto"
          />
        </div>
      </header>

      {bulkImportMessage ? (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {bulkImportMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.03))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <p className="text-sm text-slate-300">Total del mes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            + {totalAmount.toFixed(2)} €
          </p>
        </div>
        <div className="rounded-[30px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <p className="text-sm text-slate-400">Movimientos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {incomes.length}
          </p>
        </div>
        <div className="rounded-[30px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
          <p className="text-sm text-slate-400">Categorías activas</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {new Set(incomes.map((income) => income.category)).size}
          </p>
        </div>
      </div>

      {!loading && !error && incomes.length > 0 ? (
        <ListControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por fuente o descripción"
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: "date_desc", label: "Fecha: reciente primero" },
            { value: "date_asc", label: "Fecha: antigua primero" },
            { value: "name_asc", label: "Nombre: A-Z" },
            { value: "name_desc", label: "Nombre: Z-A" },
            { value: "amount_desc", label: "Importe: mayor a menor" },
            { value: "amount_asc", label: "Importe: menor a mayor" },
          ]}
          resultsCount={filteredIncomes.length}
          totalCount={incomes.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearch("");
            setSortBy("date_desc");
          }}
        />
      ) : null}

      {loading ? (
        <div className="rounded-[30px] border border-white/8 bg-white/[0.04] p-6 text-sm text-slate-400">
          Cargando ingresos...
        </div>
      ) : error ? (
        <div className="rounded-[30px] border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
          {error}
        </div>
      ) : incomes.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No hay ingresos registrados para este mes.
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No hay resultados para la búsqueda o el orden seleccionado.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncomes.map((income) => {
            const categoryColor = getIncomeCategoryColor(income);

            return (
              <IncomeCard
                key={income.id}
                income={income}
                categoryColor={categoryColor}
                onEdit={(selectedIncome) => setEditingIncome(selectedIncome)}
                onDelete={handleDeleteIncome}
              />
            );
          })}
        </div>
      )}

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        title="Cargar ingresos masivamente"
        description="Descarga la plantilla, complétala en Excel y revisa la vista previa antes de guardar los ingresos."
        instructions={[
          "Descarga la plantilla con el formato correcto.",
          "Rellena una fila por ingreso usando una categoria de ingreso existente.",
          "Carga el Excel para validar importes, categorias y fechas.",
          "Guarda todos los ingresos de una sola vez cuando no haya errores.",
        ]}
        previewColumns={[
          { key: "description", label: "Descripcion" },
          { key: "amount", label: "Importe" },
          { key: "categoryName", label: "Categoria" },
          { key: "date", label: "Fecha" },
        ]}
        onDownloadTemplate={downloadIncomeTemplate}
        onParseFile={parseIncomeFile}
        onConfirm={saveBulkIncomes}
        confirmLabel="Guardar ingresos"
        emptyPreviewMessage="Carga una plantilla Excel para previsualizar los ingresos."
      />

      <QuickAddIncome
        year={year}
        month={month}
        income={editingIncome}
        open={Boolean(editingIncome)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingIncome(null);
          }
        }}
        onSaved={async () => {
          setEditingIncome(null);
          await fetchIncomes();
        }}
      />
    </section>
  );
}
