import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthErrorMessage } from "../services/authApi";

export default function Register() {
  const navigate = useNavigate();
  const { authenticated, initialized, register } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    family_name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (initialized && authenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (
      !form.username.trim() ||
      !form.password ||
      !form.email.trim() ||
      !form.family_name.trim()
    ) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      setSubmitting(true);
      await register({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        family_name: form.family_name.trim(),
      });
      navigate("/", { replace: true });
    } catch (submitError) {
      console.error(submitError);
      setError(
        getAuthErrorMessage(submitError, "No se pudo crear la cuenta")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
          ControlAnts
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Crear cuenta</h1>
        <p className="text-sm text-slate-500">
          Registra la familia y entra directamente con sesión basada en cookies.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Usuario
          </label>
          <input
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                username: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre de la familia
          </label>
          <input
            type="text"
            value={form.family_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                family_name: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Inicia sesión
        </Link>
      </p>
    </section>
  );
}
