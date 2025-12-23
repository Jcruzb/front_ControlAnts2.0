import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AddExpense = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) {
      setError("El importe debe ser mayor que 0");
      return;
    }
    if (!category.trim()) {
      setError("La categoría es obligatoria");
      return;
    }

    try {
      setLoading(true);

      await api.post("/expenses/", {
        name,
        amount,
        category,
        date,
      });

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
          Registra un nuevo gasto en el mes actual
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <span className="text-sm text-gray-500">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-lg border px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una categoría</option>
            <option value="Alimentación">🍎 Alimentación</option>
            <option value="Salidas">🍹 Salidas</option>
            <option value="Transporte">🚗 Transporte</option>
            <option value="Vivienda">🏠 Vivienda</option>
            <option value="Servicios">💡 Servicios</option>
            <option value="Ocio">🎮 Ocio</option>
            <option value="Salud">💊 Salud</option>
            <option value="Educación">📚 Educación</option>
            <option value="Inversiones">📈 Inversiones</option>
            <option value="Otros">📦 Otros</option>
          </select>
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
    </section>
  );
};

export default AddExpense;