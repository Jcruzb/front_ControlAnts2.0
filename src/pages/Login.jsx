import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getAuthErrorMessage } from "../services/authApi";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, initialized, login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const redirectTo = useMemo(
    () => location.state?.from?.pathname || "/",
    [location.state]
  );

  if (initialized && authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!form.username.trim() || !form.password) {
      setError("Usuario y contraseña son obligatorios");
      return;
    }

    try {
      setSubmitting(true);
      await login({
        username: form.username.trim(),
        password: form.password,
      });
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      console.error(submitError);
      setError(
        getAuthErrorMessage(submitError, "No se pudo iniciar sesión")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center justify-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[36px] border border-white/8 bg-[linear-gradient(145deg,rgba(29,78,216,0.22),rgba(6,10,18,0.8)_45%,rgba(16,185,129,0.16))] p-8 shadow-[0_28px_70px_rgba(0,0,0,0.28)] lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(59,130,246,0.55))] text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.32)]">
                CA
              </span>
              <span className="text-sm font-medium tracking-[0.22em] text-slate-200">
                CONTROLANTS
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-blue-200/80">
                Acceso privado
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white">
                Tu presupuesto familiar, en un espacio claro y compartido.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">
                Entra para revisar gastos, ingresos y planificación mensual con el
                mismo entorno visual del resto de la aplicación.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Presupuesto
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Control del mes en un vistazo.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Gastos
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Seguimiento de movimientos y fijos.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Ingresos
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Registro y visión de entradas de dinero.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:p-8 lg:p-9">
          <div className="mb-8 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Iniciar sesión
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              Accede con tu usuario para entrar en el área privada de la familia.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200">
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
                className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                placeholder="Tu usuario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
                placeholder="Tu contraseña"
              />
            </div>

            {error && (
              <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[24px] bg-blue-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-300 transition hover:text-blue-200"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
