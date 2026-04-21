import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import recurringPaymentsService from "../services/recurringPaymentsService";
import RecurringPaymentItem from "../components/RecurringPaymentItem";
import RecurringPaymentForm from "../components/RecurringPaymentForm";
import ListControls from "../components/ListControls";
import BulkImportModal from "../components/BulkImportModal";
import ExpenseDetailSheet from "../components/ExpenseDetailSheet";
import ExpenseFormModal from "../components/ExpenseFormModal";
import api, { getApiErrorMessage } from "../services/api";
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

/**
 * RecurringPayments
 * -----------------
 * Vista principal de Gastos fijos.
 * - Lista gastos fijos
 * - Permite crear / editar / desactivar
 * - NO registra pagos
 */
export default function RecurringPayments() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalSessionKey, setModalSessionKey] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportMessage, setBulkImportMessage] = useState(null);
  const [detailState, setDetailState] = useState({
    isOpen: false,
    loading: false,
    error: null,
    data: null,
  });
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentFormLoading, setPaymentFormLoading] = useState(false);
  const [paymentFormError, setPaymentFormError] = useState(null);
  const activeDetailRequestRef = useRef(0);

  // Mapa rápido de categorías por id
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = items.filter((item) => {
      const categoryName = String(categoryMap[item.category]?.name || "Sin categoría").toLowerCase();
      const name = String(item.name || "").toLowerCase();
      const hasEndDate = Boolean(item.end_date);
      const isEnded = hasEndDate && new Date(item.end_date) < today;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        name.includes(normalizedSearch) ||
        categoryName.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active === true) ||
        (statusFilter === "inactive" && item.active !== true) ||
        (statusFilter === "with_end_date" && hasEndDate) ||
        (statusFilter === "without_end_date" && !hasEndDate) ||
        (statusFilter === "ended" && isEnded);

      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "name_desc":
          return String(b.name || "").localeCompare(String(a.name || ""), "es");
        case "amount_asc":
          return Number(a.amount || 0) - Number(b.amount || 0);
        case "amount_desc":
          return Number(b.amount || 0) - Number(a.amount || 0);
        case "name_asc":
        default:
          return String(a.name || "").localeCompare(String(b.name || ""), "es");
      }
    });

    return result;
  }, [items, search, sortBy, statusFilter, categoryMap]);

  const hasActiveFilters =
    search.trim().length > 0 || sortBy !== "name_asc" || statusFilter !== "all";

  const categoryLookup = useMemo(
    () => buildCategoryLookup(categories),
    [categories]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recurring, cats] = await Promise.all([
        recurringPaymentsService.getAll(),
        getCategories(),
      ]);
      setItems(recurring);
      setCategories(cats);
    } catch (loadError) {
      console.error("Error cargando gastos fijos", loadError);
      setError(
        getApiErrorMessage(loadError, "No se pudieron cargar los gastos fijos")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setModalSessionKey((current) => current + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setModalSessionKey((current) => current + 1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (data) => {
    try {
      setError(null);
      if (editingItem) {
        await recurringPaymentsService.update(editingItem.id, data);
      } else {
        await recurringPaymentsService.create(data);
      }
      closeModal();
      loadData();
    } catch (submitError) {
      console.error("Error guardando gasto fijo", submitError);
      setError(
        getApiErrorMessage(submitError, "No se pudo guardar el gasto fijo")
      );
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("¿Desactivar este gasto fijo?")) return;

    try {
      setError(null);
      await recurringPaymentsService.deactivate(id);
      loadData();
    } catch (deactivateError) {
      console.error("Error desactivando gasto fijo", deactivateError);
      setError(
        getApiErrorMessage(
          deactivateError,
          "No se pudo desactivar el gasto fijo"
        )
      );
    }
  };

  const handleReactivate = async (id) => {
    try {
      setError(null);
      await recurringPaymentsService.reactivate(id);
      loadData();
    } catch (reactivateError) {
      console.error("Error reactivando gasto fijo", reactivateError);
      setError(
        getApiErrorMessage(
          reactivateError,
          "No se pudo reactivar el gasto fijo"
        )
      );
    }
  };

  const openRecurringDetail = async (item) => {
    const requestId = activeDetailRequestRef.current + 1;
    activeDetailRequestRef.current = requestId;

    setDetailState({
      isOpen: true,
      loading: true,
      error: null,
      data: {
        ...item,
        payments: [],
      },
    });

    try {
      const detail = await recurringPaymentsService.getPayments(item.id);
      if (activeDetailRequestRef.current !== requestId) {
        return;
      }

      setDetailState({
        isOpen: true,
        loading: false,
        error: null,
        data: detail,
      });
    } catch (detailError) {
      console.error(detailError);
      if (activeDetailRequestRef.current !== requestId) {
        return;
      }

      setDetailState({
        isOpen: true,
        loading: false,
        error: getApiErrorMessage(
          detailError,
          "No se pudo cargar el detalle del gasto fijo"
        ),
        data: {
          ...item,
          payments: [],
        },
      });
    }
  };

  const closeRecurringDetail = () => {
    activeDetailRequestRef.current += 1;
    setDetailState((current) => ({ ...current, isOpen: false }));
    setEditingPayment(null);
    setPaymentFormError(null);
  };

  async function handleSavePayment(payload) {
    if (!editingPayment?.id) return;

    if (!payload.amount || Number(payload.amount) <= 0) {
      setPaymentFormError("El importe debe ser mayor que 0");
      return;
    }

    if (!String(payload.category).trim()) {
      setPaymentFormError("La categoría es obligatoria");
      return;
    }

    try {
      setPaymentFormLoading(true);
      setPaymentFormError(null);
      const response = await api.patch(`/expenses/${editingPayment.id}/`, {
        ...payload,
        category: Number(payload.category),
      });

      setDetailState((current) => {
        if (!current.data) return current;

        return {
          ...current,
          data: {
            ...current.data,
            payments: current.data.payments.map((payment) =>
              payment.id === editingPayment.id ? response : payment
            ),
          },
        };
      });
      setEditingPayment(null);
    } catch (saveError) {
      console.error(saveError);
      setPaymentFormError(
        getApiErrorMessage(saveError, "No se pudo guardar el pago")
      );
    } finally {
      setPaymentFormLoading(false);
    }
  }

  async function handleDeletePayment(payment) {
    if (
      !window.confirm(
        `¿Eliminar ${payment?.description || "este pago"}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/expenses/${payment.id}/`);
      setDetailState((current) => {
        if (!current.data) return current;

        const nextPayments = current.data.payments.filter(
          (item) => item.id !== payment.id
        );

        return {
          ...current,
          data: {
            ...current.data,
            payments: nextPayments,
          },
          isOpen: nextPayments.length > 0 ? current.isOpen : false,
        };
      });
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        getApiErrorMessage(deleteError, "No se pudo eliminar el pago")
      );
    }
  }

  async function downloadRecurringTemplate() {
    await downloadWorkbook("plantilla-gastos-fijos.xlsx", [
      {
        name: "GastosFijos",
        data: [
          {
            nombre: "Netflix",
            importe: "12.99",
            categoria: categories[0]?.name || "Ocio",
            dia_cobro: "5",
            fecha_inicio: getTodayLocalDate(),
            fecha_fin: "",
          },
        ],
        columns: [28, 14, 24, 12, 16, 16],
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
          ["nombre", "Nombre del gasto fijo"],
          ["importe", "Numero positivo. Ejemplo: 39.90"],
          ["categoria", "Nombre exacto de una categoria existente"],
          ["dia_cobro", "Numero entre 1 y 31"],
          ["fecha_inicio", "Formato recomendado: YYYY-MM-DD"],
          ["fecha_fin", "Opcional. Dejalo vacio si no aplica"],
        ],
        columns: [18, 48],
      },
    ]);
  }

  async function downloadExistingRecurringPayments() {
    await downloadWorkbook("gastos-fijos-existentes.xlsx", [
      {
        name: "GastosFijos",
        data: items.map((item) => ({
          nombre: item.name || "",
          importe:
            item.amount !== null && item.amount !== undefined
              ? Number(item.amount).toFixed(2)
              : "",
          categoria: categoryMap[item.category]?.name || "Sin categoría",
          dia_cobro:
            item.due_day !== null && item.due_day !== undefined
              ? String(item.due_day)
              : "",
          fecha_inicio: item.start_date || "",
          fecha_fin: item.end_date || "",
          activo: item.active === true ? "Si" : "No",
        })),
        columns: [28, 14, 24, 12, 16, 16, 10],
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
          ["Total gastos fijos", String(items.length)],
          [
            "Activos",
            String(items.filter((item) => item.active === true).length),
          ],
          [
            "Inactivos",
            String(items.filter((item) => item.active !== true).length),
          ],
        ],
        columns: [22, 14],
      },
    ]);
  }

  async function parseRecurringFile(file) {
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

      const name = String(
        normalizedRow.nombre || normalizedRow.name || normalizedRow.concepto || ""
      ).trim();
      const amount = parsePositiveAmount(
        normalizedRow.importe || normalizedRow.amount || normalizedRow.monto
      );
      const categoryValue = String(
        normalizedRow.categoria || normalizedRow.category || ""
      ).trim();
      const dueDay = Number(
        String(
          normalizedRow.dia_cobro ||
            normalizedRow.dia ||
            normalizedRow.due_day ||
            ""
        ).trim()
      );
      const startDate = await parseSpreadsheetDate(
        normalizedRow.fecha_inicio ||
          normalizedRow.start_date ||
          normalizedRow.inicio
      );
      const endDate = await parseSpreadsheetDate(
        normalizedRow.fecha_fin || normalizedRow.end_date || normalizedRow.fin
      );
      const category = categoryLookup.get(normalizeText(categoryValue));

      if (!name) {
        errors.push(`Fila ${rowNumber}: el nombre es obligatorio.`);
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push(`Fila ${rowNumber}: el importe debe ser mayor que 0.`);
      }

      if (!category) {
        errors.push(
          `Fila ${rowNumber}: la categoria "${categoryValue || "vacia"}" no existe.`
        );
      }

      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        errors.push(`Fila ${rowNumber}: el dia_cobro debe estar entre 1 y 31.`);
      }

      if (!startDate) {
        errors.push(`Fila ${rowNumber}: la fecha_inicio no es valida.`);
      }

      if (endDate && startDate && endDate < startDate) {
        errors.push(
          `Fila ${rowNumber}: la fecha_fin no puede ser anterior a la fecha_inicio.`
        );
      }

      if (
        !name ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !category ||
        !Number.isInteger(dueDay) ||
        dueDay < 1 ||
        dueDay > 31 ||
        !startDate ||
        (endDate && endDate < startDate)
      ) {
        continue;
      }

      rows.push({
        previewKey: `recurring-${rowNumber}`,
        name,
        amount: amount.toFixed(2),
        categoryName: category.name,
        dueDay: String(dueDay),
        startDate,
        endDate: endDate || "",
        payload: {
          name,
          amount,
          category: category.id,
          due_day: dueDay,
          start_date: startDate,
          end_date: endDate || null,
        },
      });
    }

    return { rows, errors };
  }

  async function saveBulkRecurring(rows) {
    for (const [index, row] of rows.entries()) {
      try {
        await recurringPaymentsService.create(row.payload);
      } catch (saveError) {
        throw new Error(
          `La fila ${index + 1} de la vista previa fallo al guardar: ${getApiErrorMessage(
            saveError,
            "No se pudo crear el gasto fijo"
          )}`
        );
      }
    }

    await loadData();
    setBulkImportMessage(
      `Se importaron ${rows.length} gastos fijos correctamente.`
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Gastos fijos
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Gastos fijos</h1>
          <p className="mt-2 text-sm text-slate-400">
            Compromisos mensuales que forman parte de tu presupuesto
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={downloadExistingRecurringPayments}
            disabled={items.length === 0}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportar existentes
          </button>
          <button
            type="button"
            onClick={downloadRecurringTemplate}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
          >
            Descargar plantilla
          </button>
          <button
            type="button"
            onClick={() => setBulkImportOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
          >
            Importar Excel
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            + Añadir
          </button>
        </div>
      </div>

      {bulkImportMessage ? (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {bulkImportMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <ListControls
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre o categoría"
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={[
            { value: "name_asc", label: "Nombre: A-Z" },
            { value: "name_desc", label: "Nombre: Z-A" },
            { value: "amount_desc", label: "Importe: mayor a menor" },
            { value: "amount_asc", label: "Importe: menor a mayor" },
          ]}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "all", label: "Todos" },
            { value: "active", label: "Activos" },
            { value: "inactive", label: "Inactivos" },
            { value: "with_end_date", label: "Con fecha fin" },
            { value: "without_end_date", label: "Sin fecha fin" },
            { value: "ended", label: "Finalizados" },
          ]}
          resultsCount={filteredItems.length}
          totalCount={items.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearch("");
            setSortBy("name_asc");
            setStatusFilter("all");
          }}
        />
      ) : null}

      {loading ? (
        <div className="rounded-[30px] border border-white/8 bg-white/[0.04] p-6 text-slate-400">
          Cargando gastos fijos…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-slate-400">
          <p className="mb-2">Aún no tienes gastos fijos</p>
          <button
            onClick={openCreateModal}
            className="text-blue-300 transition hover:text-blue-200"
          >
            Añadir tu primer gasto fijo
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-slate-400">
          No hay resultados para la búsqueda o los filtros actuales.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <RecurringPaymentItem
              key={item.id}
              item={item}
              categoryMap={categoryMap}
              onEdit={openEditModal}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              onOpenDetails={openRecurringDetail}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <RecurringPaymentForm
        key={`recurring-payment-form-${modalSessionKey}-${editingItem?.id || "create"}`}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editingItem}
        categories={categories}
        onCategoryCreated={(newCategory) => {
          setCategories((prev) => [newCategory, ...prev]);
        }}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        title="Cargar gastos fijos masivamente"
        description="Descarga la plantilla, complétala en Excel y revisa la vista previa antes de guardar los compromisos mensuales."
        instructions={[
          "Descarga la plantilla con el formato correcto.",
          "Rellena una fila por gasto fijo con categoria existente.",
          "Carga el Excel para validar fechas, importes y dia de cobro.",
          "Guarda solo cuando la vista previa no muestre errores.",
        ]}
        previewColumns={[
          { key: "name", label: "Nombre" },
          { key: "amount", label: "Importe" },
          { key: "categoryName", label: "Categoria" },
          { key: "dueDay", label: "Dia cobro" },
          { key: "startDate", label: "Inicio" },
          { key: "endDate", label: "Fin" },
        ]}
        onDownloadTemplate={downloadRecurringTemplate}
        onParseFile={parseRecurringFile}
        onConfirm={saveBulkRecurring}
        confirmLabel="Guardar gastos fijos"
        emptyPreviewMessage="Carga una plantilla Excel para previsualizar los gastos fijos."
      />

      <ExpenseDetailSheet
        isOpen={detailState.isOpen}
        title={detailState.data?.name || "Gasto fijo"}
        subtitle={
          detailState.data
            ? categoryMap[detailState.data.category]?.name || "Sin categoría"
            : null
        }
        amount={detailState.data?.amount ?? null}
        meta={
          detailState.data
            ? [
                {
                  label: "Día de cobro",
                  value: detailState.data.due_day
                    ? `Día ${detailState.data.due_day}`
                    : "Sin definir",
                },
                {
                  label: "Inicio",
                  value: detailState.data.start_date || "Sin fecha",
                },
                {
                  label: "Fin",
                  value: detailState.data.end_date || "Sin fecha de fin",
                },
                {
                  label: "Estado",
                  value: detailState.data.active ? "Activo" : "Inactivo",
                },
              ]
            : []
        }
        payments={detailState.data?.payments || []}
        loading={detailState.loading}
        error={detailState.error}
        emptyMessage="Este gasto fijo aún no tiene pagos registrados."
        onClose={closeRecurringDetail}
        onEditPayment={(payment) => {
          setPaymentFormError(null);
          setEditingPayment(payment);
        }}
        onDeletePayment={handleDeletePayment}
        getPaymentCategoryLabel={(payment) =>
          categoryMap[payment.category]?.name || null
        }
      />

      <ExpenseFormModal
        key={editingPayment?.id ?? "recurring-payment-form"}
        isOpen={Boolean(editingPayment)}
        expense={editingPayment}
        categories={categories}
        loading={paymentFormLoading}
        error={paymentFormError}
        onClose={() => {
          if (paymentFormLoading) return;
          setEditingPayment(null);
          setPaymentFormError(null);
        }}
        onSubmit={handleSavePayment}
      />
    </div>
  );
}
