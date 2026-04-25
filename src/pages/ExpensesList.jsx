import { useCallback, useEffect, useMemo, useState } from "react";
import MonthNavigation from "../components/MonthNavigation";
import ListControls from "../components/ListControls";
import BulkImportModal from "../components/BulkImportModal";
import CardActionsMenu from "../components/CardActionsMenu";
import ExpenseFormModal from "../components/ExpenseFormModal";
import ExpenseDetailSheet from "../components/ExpenseDetailSheet";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import api, {
  getApiErrorMessage,
  unwrapCollectionResponse,
} from "../services/api";
import { getCategories } from "../services/categories";
import { getFamilyMembers } from "../services/familyMembers";
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

function getExpenseCategoryName(expense) {
  if (typeof expense?.category_detail?.name === "string") {
    return expense.category_detail.name;
  }

  if (typeof expense?.category_name === "string") {
    return expense.category_name;
  }

  if (typeof expense?.category?.name === "string") {
    return expense.category.name;
  }

  if (typeof expense?.category === "string") {
    return expense.category;
  }

  return "Sin categoría";
}

function getExpenseCategoryIcon(expense) {
  if (typeof expense?.category_detail?.icon === "string") {
    return expense.category_detail.icon;
  }

  if (typeof expense?.category_icon === "string") {
    return expense.category_icon;
  }

  if (typeof expense?.category?.icon === "string") {
    return expense.category.icon;
  }

  return expense?.is_recurring === true ? "🔁" : "💸";
}

function getExpensePayerName(expense) {
  if (typeof expense?.payer_detail?.name === "string" && expense.payer_detail.name.trim()) {
    return expense.payer_detail.name;
  }

  return null;
}

function ExpenseCard({ expense, onEdit, onDelete, onOpenDetails }) {
  const title = expense.description || "Gasto";
  const subtitle = getExpenseCategoryName(expense);
  const payerName = getExpensePayerName(expense);
  const handleCardClick = (event) => {
    if (typeof onOpenDetails !== "function") return;

    if (
      event.target.closest(
        'button, a, input, select, textarea, [data-no-detail-open="true"]'
      )
    ) {
      return;
    }

    onOpenDetails(expense);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`flex min-w-0 flex-col gap-3 rounded-[30px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        typeof onOpenDetails === "function" ? "cursor-pointer hover:border-white/12" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl">
          {getExpenseCategoryIcon(expense)}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-medium text-white">
            {expense.is_recurring === true ? (
              <span className="mr-1 text-slate-500">🔁</span>
            ) : null}
            {title}
          </p>
          <p className="text-sm text-slate-400">{subtitle}</p>
          {payerName ? (
            <p className="text-xs text-slate-500">Paga: {payerName}</p>
          ) : null}
          <p className="text-xs text-slate-500">{expense.date}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-start justify-between gap-3 sm:ml-4 sm:items-center">
        <div className="text-left sm:text-right">
          <p className="text-lg font-semibold text-red-300">
            − {Number(expense.amount).toFixed(2)} €
          </p>
        </div>

        <CardActionsMenu
          title={title}
          subtitle={subtitle}
          actions={[
            {
              label: "Editar",
              onSelect: () => onEdit(expense),
            },
            {
              label: "Eliminar",
              tone: "danger",
              onSelect: () => onDelete(expense),
            },
          ]}
        />
      </div>
    </div>
  );
}

const ExpensesList = () => {
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
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [payers, setPayers] = useState([]);
  const [payersError, setPayersError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [detailExpense, setDetailExpense] = useState(null);

  const fetchExpenses = useCallback(async ({
    silent = false,
    includeCategories = false,
    includePayers = false,
  } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      if (includePayers) {
        setPayersError(null);
      }

      const data = await api.get("/expenses/", {
        params: { year, month },
      });

      setExpenses(unwrapCollectionResponse(data));

      if (includeCategories) {
        const [categoriesData, payersData] = await Promise.all([
          getCategories(),
          includePayers
            ? getFamilyMembers().catch((loadPayersError) => {
                console.error(loadPayersError);
                setPayersError(
                  getApiErrorMessage(
                    loadPayersError,
                    "No se pudieron cargar los pagadores"
                  )
                );
                return [];
              })
            : Promise.resolve([]),
        ]);
        setCategories(categoriesData);
        if (includePayers) {
          setPayers(payersData);
        }
      }
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudieron cargar los gastos"));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [month, year]);

  useEffect(() => {
    fetchExpenses({ includeCategories: true, includePayers: true });
  }, [fetchExpenses]);

  const categoryLookup = useMemo(
    () => buildCategoryLookup(categories),
    [categories]
  );

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = expenses.filter((expense) => {
      const categoryName = getExpenseCategoryName(expense).toLowerCase();
      const description = String(expense.description || "Gasto").toLowerCase();
      const payerId = expense?.payer != null ? String(expense.payer) : "";

      const matchesSearch =
        normalizedSearch.length === 0 ||
        description.includes(normalizedSearch) ||
        categoryName.includes(normalizedSearch);

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "recurring" && expense.is_recurring === true) ||
        (typeFilter === "manual" && expense.is_recurring !== true);
      const matchesPayer = payerFilter === "all" || payerId === payerFilter;

      return matchesSearch && matchesType && matchesPayer;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return String(a.description || "Gasto").localeCompare(
            String(b.description || "Gasto"),
            "es"
          );
        case "name_desc":
          return String(b.description || "Gasto").localeCompare(
            String(a.description || "Gasto"),
            "es"
          );
        case "amount_asc":
          return Number(a.amount || 0) - Number(b.amount || 0);
        case "amount_desc":
          return Number(b.amount || 0) - Number(a.amount || 0);
        case "date_asc":
          return new Date(a.date || 0) - new Date(b.date || 0);
        case "date_desc":
        default:
          return new Date(b.date || 0) - new Date(a.date || 0);
      }
    });

    return result;
  }, [expenses, search, sortBy, typeFilter, payerFilter]);

  const payerOptions = useMemo(
    () => [
      { value: "all", label: "Todos los pagadores" },
      ...payers
        .map((payer) => ({
          value: String(payer.id),
          label: payer.name || payer.email || "Sin nombre",
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    ],
    [payers]
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    sortBy !== "date_desc" ||
    typeFilter !== "all" ||
    payerFilter !== "all";

  async function downloadExpenseTemplate() {
    await downloadWorkbook("plantilla-gastos.xlsx", [
      {
        name: "Gastos",
        data: [
          {
            descripcion: "Supermercado",
            importe: "45.90",
            categoria: categories[0]?.name || "Alimentacion",
            fecha: getTodayLocalDate(),
          },
        ],
        columns: [30, 14, 24, 16],
      },
      {
        name: "Categorias",
        data: categories.map((category) => ({
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
          ["descripcion", "Texto libre del gasto"],
          ["importe", "Numero positivo. Ejemplo: 45.90"],
          ["categoria", "Nombre exacto de una categoria existente"],
          ["fecha", "Formato recomendado: YYYY-MM-DD"],
        ],
        columns: [18, 48],
      },
    ]);
  }

  async function downloadExistingExpenses() {
    await downloadWorkbook("gastos-existentes.xlsx", [
      {
        name: "Gastos",
        data: expenses.map((expense) => ({
          descripcion: expense.description || "",
          importe:
            expense.amount !== null && expense.amount !== undefined
              ? Number(expense.amount).toFixed(2)
              : "",
          categoria: getExpenseCategoryName(expense),
          fecha: expense.date || "",
          tipo: expense.is_recurring === true ? "Recurrente" : "Puntual",
        })),
        columns: [30, 14, 24, 16, 14],
      },
      {
        name: "Categorias",
        data: categories.map((category) => ({
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
          ["Total gastos", String(expenses.length)],
          [
            "Total importe",
            totalAmount.toFixed(2),
          ],
          [
            "Recurrentes",
            String(expenses.filter((expense) => expense.is_recurring === true).length),
          ],
          [
            "Puntuales",
            String(expenses.filter((expense) => expense.is_recurring !== true).length),
          ],
        ],
        columns: [22, 14],
      },
    ]);
  }

  async function parseExpenseFile(file) {
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
      const category = categoryLookup.get(normalizeText(categoryValue));

      if (!description) {
        errors.push(`Fila ${rowNumber}: la descripcion es obligatoria.`);
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push(`Fila ${rowNumber}: el importe debe ser mayor que 0.`);
      }

      if (!category) {
        errors.push(
          `Fila ${rowNumber}: la categoria "${categoryValue || "vacia"}" no existe.`
        );
      }

      if (!date) {
        errors.push(`Fila ${rowNumber}: la fecha no es valida.`);
      }

      if (!description || !Number.isFinite(amount) || amount <= 0 || !category || !date) {
        continue;
      }

      rows.push({
        previewKey: `expense-${rowNumber}`,
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

  async function saveBulkExpenses(rows) {
    for (const [index, row] of rows.entries()) {
      try {
        await api.post("/expenses/", row.payload);
      } catch (saveError) {
        throw new Error(
          `La fila ${index + 1} de la vista previa fallo al guardar: ${getApiErrorMessage(
            saveError,
            "No se pudo crear el gasto"
          )}`
        );
      }
    }

    await fetchExpenses();
    setBulkImportMessage(
      `Se importaron ${rows.length} gastos correctamente.`
    );
  }

  async function handleSaveExpense(payload) {
    if (!editingExpense?.id) return;

    if (!payload.amount || Number(payload.amount) <= 0) {
      setFormError("El importe debe ser mayor que 0");
      return;
    }

    if (!String(payload.category).trim()) {
      setFormError("La categoría es obligatoria");
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      const response = await api.patch(`/expenses/${editingExpense.id}/`, {
        ...payload,
        category: Number(payload.category),
      });
      const updatedExpense = response ?? {
        ...editingExpense,
        ...payload,
        category: Number(payload.category),
      };
      setExpenses((current) =>
        current.map((item) =>
          item.id === editingExpense.id ? { ...item, ...updatedExpense } : item
        )
      );
      setDetailExpense((current) =>
        current?.id === editingExpense.id ? { ...current, ...updatedExpense } : current
      );
      setEditingExpense(null);
    } catch (saveError) {
      console.error(saveError);
      setFormError(
        getApiErrorMessage(saveError, "No se pudo guardar el gasto")
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteExpense(expense) {
    const expenseLabel = expense?.description || "este gasto";

    if (
      !window.confirm(
        `¿Eliminar ${expenseLabel}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/expenses/${expense.id}/`);
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      setDetailExpense((current) => (current?.id === expense.id ? null : current));
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        getApiErrorMessage(deleteError, "No se pudo eliminar el gasto")
      );
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 text-center text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        Cargando gastos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex min-w-0 flex-col gap-4">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Gastos
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Gastos del mes
          </h1>
          <p className="text-sm text-slate-400">
            Resumen y detalle de tus gastos de {monthLabel.toLowerCase()}
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
          />
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={downloadExistingExpenses}
            disabled={expenses.length === 0}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Exportar existentes
          </button>
          <button
            type="button"
            onClick={downloadExpenseTemplate}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] sm:w-auto"
          >
            Descargar plantilla
          </button>
          <button
            type="button"
            onClick={() => setBulkImportOpen(true)}
            className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 sm:w-auto"
          >
            Importar Excel
          </button>
        </div>
      </header>

      {bulkImportMessage ? (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {bulkImportMessage}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Total del mes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            − {totalAmount.toFixed(2)} €
          </p>
        </div>
      </div>

      {expenses.length > 0 && (
        <ListControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre o categoría"
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
          filterValue={typeFilter}
          onFilterChange={setTypeFilter}
          filterOptions={[
            { value: "all", label: "Todos" },
            { value: "manual", label: "Puntuales" },
            { value: "recurring", label: "Recurrentes" },
          ]}
          extraSelectValue={payerFilter}
          onExtraSelectChange={setPayerFilter}
          extraSelectLabel="Pagador"
          extraSelectOptions={payerOptions}
          resultsCount={filteredExpenses.length}
          totalCount={expenses.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearch("");
            setSortBy("date_desc");
            setTypeFilter("all");
            setPayerFilter("all");
          }}
        />
      )}

      {expenses.length === 0 && (
        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-slate-400">
          No hay gastos registrados este mes.
        </div>
      )}

      {expenses.length > 0 && filteredExpenses.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No hay resultados para la búsqueda o los filtros actuales.
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredExpenses.map((expense) => (
          <ExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={(selectedExpense) => {
              setFormError(null);
              setEditingExpense(selectedExpense);
            }}
            onDelete={handleDeleteExpense}
            onOpenDetails={setDetailExpense}
          />
        ))}
      </div>

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        title="Cargar gastos masivamente"
        description="Descarga la plantilla, complétala en Excel y revisa la vista previa antes de guardar."
        instructions={[
          "Descarga la plantilla con las columnas correctas.",
          "Rellena una fila por gasto usando nombres de categoria existentes.",
          "Carga el archivo Excel para validar y revisar la vista previa.",
          "Guarda todos los gastos de una sola vez cuando no haya errores.",
        ]}
        previewColumns={[
          { key: "description", label: "Descripcion" },
          { key: "amount", label: "Importe" },
          { key: "categoryName", label: "Categoria" },
          { key: "date", label: "Fecha" },
        ]}
        onDownloadTemplate={downloadExpenseTemplate}
        onParseFile={parseExpenseFile}
        onConfirm={saveBulkExpenses}
        confirmLabel="Guardar gastos"
        emptyPreviewMessage="Carga una plantilla Excel para previsualizar los gastos."
      />

      <ExpenseFormModal
        key={editingExpense?.id ?? "expense-form"}
        isOpen={Boolean(editingExpense)}
        expense={editingExpense}
        categories={categories}
        payers={payers}
        payersError={payersError}
        loading={formLoading}
        error={formError}
        onClose={() => {
          if (formLoading) return;
          setEditingExpense(null);
          setFormError(null);
        }}
        onSubmit={handleSaveExpense}
      />

      <ExpenseDetailSheet
        isOpen={Boolean(detailExpense)}
        title={detailExpense?.description || "Gasto"}
        subtitle={detailExpense ? getExpenseCategoryName(detailExpense) : null}
        amount={detailExpense?.amount ?? null}
        meta={
          detailExpense
            ? [
                { label: "Fecha", value: detailExpense.date || "Sin fecha" },
                {
                  label: "Tipo",
                  value:
                    detailExpense.is_recurring === true
                      ? "Pago recurrente"
                      : "Gasto puntual",
                },
                ...(getExpensePayerName(detailExpense)
                  ? [
                      {
                        label: "Pagador",
                        value: getExpensePayerName(detailExpense),
                      },
                    ]
                  : []),
              ]
            : []
        }
        payments={detailExpense ? [detailExpense] : []}
        emptyMessage="Este gasto no tiene más pagos asociados."
        onClose={() => setDetailExpense(null)}
        onEditPayment={(payment) => {
          setFormError(null);
          setEditingExpense(payment);
        }}
        onDeletePayment={handleDeleteExpense}
        getPaymentCategoryLabel={(payment) => getExpenseCategoryName(payment)}
      />
    </section>
  );
};

export default ExpensesList;
