import { useState } from "react";
import { createCategory } from "../services/categories";
import { getApiErrorMessage } from "../services/api";

const AddCategoryModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    try {
      setLoading(true);
      const category = await createCategory({
        name,
        icon,
      });
      onCreated(category);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo crear la categoría"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-4 rounded-[30px] border border-white/10 bg-[#0d1117] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div>
          <p className="text-sm text-slate-400">Nueva categoría</p>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Crear categoría
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
          />

          <input
            type="text"
            placeholder="Icono (opcional, ej: 🍎)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
          />

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {loading ? "Creando…" : "Crear"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-slate-200 transition hover:bg-white/[0.08]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
