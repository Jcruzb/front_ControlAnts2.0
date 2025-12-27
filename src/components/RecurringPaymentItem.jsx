

/**
 * RecurringPaymentItem
 * --------------------
 * Representa un gasto fijo dentro de la lista de Gastos fijos.
 *
 * Props:
 * - item: {
 *     id,
 *     name,
 *     amount,
 *     category,
 *     start_date,
 *     end_date,
 *     active
 *   }
 * - onEdit: function(item)
 * - onDeactivate: function(id)
 * - categoryMap: { [id]: { name, icon } }
 */

export default function RecurringPaymentItem({
  item,
  onEdit,
  onDeactivate,
  categoryMap = {},
}) {
  const {
    name,
    amount,
    category,
    start_date,
    end_date,
    active,
  } = item;

  const categoryInfo = categoryMap[category];

  return (
    <div
      className={`rounded-xl border p-4 flex items-center justify-between ${
        active ? "bg-white" : "bg-gray-50 opacity-60"
      }`}
    >
      {/* Info principal */}
      <div className="flex items-center space-x-3">
        <div className="text-2xl">
          {categoryInfo?.icon || "💸"}
        </div>

        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">
            {categoryInfo?.name || "Sin categoría"} ·{" "}
            {end_date
              ? `Hasta ${new Date(end_date).toLocaleDateString()}`
              : "Sin fecha de fin"}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="font-semibold text-gray-900">
            {Number(amount).toFixed(2)} €
          </p>
          {!active && (
            <p className="text-xs text-gray-400">Inactivo</p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(item)}
            className="text-indigo-600 hover:text-indigo-800 text-sm"
          >
            Editar
          </button>

          {active && (
            <button
              onClick={() => onDeactivate(item.id)}
              className="text-gray-400 hover:text-red-600 text-sm"
            >
              Desactivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}