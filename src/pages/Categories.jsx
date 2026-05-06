import { useEffect, useMemo, useState } from "react";
import AddCategoryModal from "../components/AddCategoryModal";
import EditCategoryModal from "../components/EditCategoryModal";
import { getApiErrorMessage } from "../services/api";
import { getCategories } from "../services/categories";

function CategoryCard({ category, onEdit }) {
  return (
    <article className="min-w-0 rounded-[28px] border border-white/8 bg-black/20 p-4">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl"
            style={
              category.color
                ? {
                    borderColor: `${category.color}55`,
                    backgroundColor: `${category.color}18`,
                  }
                : undefined
            }
          >
            {category.icon || "🙂"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">
              {category.name || "Sin nombre"}
            </h2>
            {category.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                {category.description}
              </p>
            ) : null}
            {category.color ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span
                  className="h-3 w-3 rounded-full border border-white/10"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.color}</span>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(category)}
          className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08]"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

export default function Categories() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getCategories();
        setData(res);
      } catch (err) {
        console.error(err);
        setError(getApiErrorMessage(err, "No se pudieron cargar las categorías"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedCategories = useMemo(() => {
    const categories = data || [];
    return [...categories].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "es")
    );
  }, [data]);

  function mergeCategory(category) {
    if (!category) return;

    setData((current) => {
      const list = Array.isArray(current) ? current : [];
      const exists = list.some((item) => item.id === category.id);

      if (exists) {
        return list.map((item) =>
          item.id === category.id ? { ...item, ...category } : item
        );
      }

      return [category, ...list];
    });
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 text-sm text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        Cargando categorías...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Configuración
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Categorías
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Gestiona nombres e iconos sin mezclarlo con la creación rápida.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 sm:w-auto"
        >
          + Crear categoría
        </button>
      </header>

      {sortedCategories.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          No hay categorías todavía.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={setEditingCategory}
            />
          ))}
        </div>
      )}

      <AddCategoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={mergeCategory}
      />

      <EditCategoryModal
        key={editingCategory?.id || "edit-category-closed"}
        isOpen={Boolean(editingCategory)}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onUpdated={mergeCategory}
      />
    </section>
  );
}
