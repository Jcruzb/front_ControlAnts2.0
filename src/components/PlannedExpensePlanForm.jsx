

import { useState } from "react";
import api from "../services/api";

/**
 * PlannedExpensePlanForm
 * Crea un PlannedExpensePlan (ONE_MONTH)
 * El backend inyecta family, created_by y crea la versión inicial.
 */
export default function PlannedExpensePlanForm({ onCreated }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/planned-expense-plans/", {
        year: Number(year),
        month: Number(month),
      });

      if (typeof onCreated === "function") {
        onCreated();
      }
    } catch (err) {
        console.log(err);
      setError("No se pudo crear el plan. Revisa los datos.");
      // opcional: console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
      <h3>Crear planificación mensual</h3>

      <div style={{ marginBottom: 12 }}>
        <label>Año</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={now.getFullYear()}
          required
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Mes</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Creando..." : "Crear plan"}
      </button>
    </form>
  );
}