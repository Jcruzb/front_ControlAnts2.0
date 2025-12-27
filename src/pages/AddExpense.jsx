import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AddCategoryModal from "../components/AddCategoryModal";

const AddExpense = () => {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);


  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get("/categories/");
        setCategories(data);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) {
      setError("El importe debe ser mayor que 0");
      return;
    }
    if (!category.trim && typeof category === "string" ? category.trim() === "" : !category) {
      setError("La categoría es obligatoria");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        description,
        amount,
        category,
        date,
      };

      await api.post("/expenses/", payload);

      navigate("/expenses");
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el gasto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Añadir gasto</h1>
        <p className="text-sm text-gray-500">
          Apunta un gasto que ya has realizado
        </p>
      </header>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl bg-white p-6 border shadow-sm"
      >
        {/* Amount (primary) */}
        <div className="space-y-2">
          <span className="text-sm text-gray-500">Importe</span>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border px-4 py-4 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">€</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <input
            type="text"
            placeholder="¿En qué fue el gasto? (Supermercado, Netflix…) "
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <span className="text-sm text-gray-500">Categoría</span>

          {loadingCategories ? (
            <p className="text-sm text-gray-400">Cargando categorías…</p>
          ) : categories.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="w-full rounded-lg border border-dashed py-3 text-sm text-blue-600 hover:bg-blue-50"
            >
              ➕ Crear primera categoría
            </button>
          ) : (
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setShowCategoryModal(true);
                } else {
                  setCategory(e.target.value);
                }
              }}
              required
              className="w-full rounded-lg border px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
              <option value="__new__">➕ Crear nueva categoría</option>
            </select>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1">
          <span className="text-sm text-gray-500">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>


        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-white text-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar gasto"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </form>

      {showCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={(newCategory) => {
            setCategories((prev) => [...prev, newCategory]);
            setCategory(newCategory.id);
            setShowCategoryModal(false);
          }}
        />
      )}
    </section>
  );
};

export default AddExpense;