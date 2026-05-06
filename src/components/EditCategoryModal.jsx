import { useState } from "react";
import { getApiErrorMessage } from "../services/api";
import { updateCategory } from "../services/categories";
import CategoryIconPicker from "./CategoryIconPicker";

function buildInitialForm(category) {
  return {
    name: category?.name || "",
    icon: category?.icon || "",
    color: category?.color || "#22c55e",
    description: category?.description || "",
  };
}

export default function EditCategoryModal({
  isOpen,
  category,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState(() => buildInitialForm(category));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !category) return null;

  const supportsColor = Object.prototype.hasOwnProperty.call(category, "color");
  const supportsDescription = Object.prototype.hasOwnProperty.call(
    category,
    "description"
  );

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    const payload = {
      name: form.name.trim(),
      icon: form.icon,
    };

    if (supportsColor) {
      payload.color = form.color;
    }

    if (supportsDescription) {
      payload.description = form.description;
    }

    try {
      setLoading(true);
      const updatedCategory = await updateCategory(category.id, payload);
      onUpdated?.(updatedCategory || { ...category, ...payload });
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo editar la categoría"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0d1117] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Categoría</p>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Editar categoría
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl leading-none text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Nombre
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              disabled={loading}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              required
            />
          </div>

          <CategoryIconPicker
            value={form.icon}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, icon: value }))
            }
            disabled={loading}
          />

          {supportsColor ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={handleChange("color")}
                  disabled={loading}
                  className="h-12 w-14 shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-1 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={handleChange("color")}
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          ) : null}

          {supportsDescription ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
                disabled={loading}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 font-medium text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
