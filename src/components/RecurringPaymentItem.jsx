import { useState, useRef, useEffect } from "react";

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
 * - onReactivate: function(id)
 * - categoryMap: { [id]: { name, icon } }
 */

export default function RecurringPaymentItem({
  item,
  onEdit,
  onDeactivate,
  onReactivate = () => {},
  categoryMap = {},
}) {
  const {
    name,
    amount,
    category,
    end_date,
    active,
  } = item;

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

  const categoryInfo = categoryMap[category];

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${active ? "bg-white" : "bg-gray-50"
        }`}
    >
      <div className="flex items-start justify-between">
        {/* Left content */}
        <div className={`flex items-start space-x-3 ${!active ? "opacity-60" : ""}`}>
          <div className="text-2xl">
            {categoryInfo?.icon || "💸"}
          </div>

          <div>
            <p className="font-medium text-gray-900">{name}</p>
            <p className="text-sm text-gray-500">
              {categoryInfo?.name || "Sin categoría"}
            </p>
            <p className="text-xs text-gray-400">
              {end_date
                ? `Hasta ${new Date(end_date).toLocaleDateString()}`
                : "Sin fecha de fin"}
            </p>
          </div>
        </div>

        {/* Right content */}
        <div className="flex flex-col items-end space-y-1">
          <p className="text-lg font-semibold text-gray-900">
            {Number(amount).toFixed(2)} €
          </p>

          {!active && (
            <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5">
              Inactivo
            </span>
          )}

          <div className="relative" ref={actionsRef}>
            <button
              onClick={() => setShowActions((v) => !v)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Abrir opciones"
            >
              ⋯
            </button>

            {showActions && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg border bg-white shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowActions(false);
                    onEdit(item);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Editar
                </button>

                {active ? (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onDeactivate(item.id);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      onReactivate(item.id);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}