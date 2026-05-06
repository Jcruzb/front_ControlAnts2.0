import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBudgetMonth } from "../hooks/useBudgetMonth";
import AddCategoryModal from "./AddCategoryModal";

const NAV_ITEMS = [
  { label: "Presupuesto", path: "/" },
  { label: "Gastos fijos", path: "/recurring" },
  { label: "Gastos", path: "/expenses" },
  { label: "Ingresos", path: "/incomes" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Mi cuenta", path: "/account" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { family, logout, profile, user } = useAuth();
  const { monthLabel } = useBudgetMonth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const isActive = (path) => location.pathname === path;
  const role = profile?.role || "member";
  const roleLabel = role === "admin" ? "Administrador" : role;
  const userName = user?.username || "Invitado";
  const userEmail = user?.email || "Sin email";
  const familyName = family?.name || "Sin familia";
  const initials = userName.slice(0, 2).toUpperCase();
  const contextualAction =
    location.pathname === "/incomes"
      ? {
          label: "+ Añadir ingreso",
          path: "/incomes",
          className:
            "rounded-2xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300",
        }
      : {
          label: "+ Añadir gasto",
          path: "/expenses/new",
          className:
            "rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400",
        };

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      setOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex h-20 w-full min-w-0 max-w-[1600px] items-center justify-between px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] sm:px-[max(1.5rem,var(--safe-left))] sm:pr-[max(1.5rem,var(--safe-right))] lg:px-[max(2rem,var(--safe-left))] lg:pr-[max(2rem,var(--safe-right))] xl:px-[max(2.5rem,var(--safe-left))] xl:pr-[max(2.5rem,var(--safe-right))]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.9),rgba(59,130,246,0.45))] text-sm font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)]">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="truncate text-xl font-semibold tracking-tight text-white">ControlAnts</div>
            <div className="truncate text-sm text-slate-400">
              Hola, <span className="font-medium text-slate-100">{userName}</span>
              {" · "}
              <span className="font-medium text-slate-200">{familyName}</span>
              {" · "}
              <span className="text-slate-500">{monthLabel}</span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <nav
            aria-label="Primary navigation"
            className="flex items-center gap-1.5 rounded-[26px] border border-white/8 bg-white/[0.04] p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  isActive(item.path)
                    ? "bg-white/[0.08] text-white shadow-inner"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]"
          >
            + Categoría
          </button>

          <Link to={contextualAction.path} className={contextualAction.className}>
            {contextualAction.label}
          </Link>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3 text-right text-xs text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
            <div className="font-semibold text-slate-100">{userEmail}</div>
            <div className="mt-1 flex items-center justify-end gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                {familyName}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  role === "admin"
                    ? "bg-amber-500/18 text-amber-200"
                    : "bg-slate-700/60 text-slate-300"
                }`}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {loggingOut ? "Saliendo..." : "Salir"}
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-200 transition hover:bg-white/[0.08] focus:outline-none md:hidden"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="w-full border-t border-white/8 bg-[rgba(10,12,17,0.96)] shadow-[0_24px_50px_rgba(0,0,0,0.35)] md:hidden"
        >
          <div className="flex w-full min-w-0 flex-col gap-4 px-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] py-5 font-medium text-slate-200">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] px-4 py-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(59,130,246,0.5))] text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{userName}</p>
                  <p className="truncate text-slate-400">{userEmail}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-300">
                  {familyName}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${
                    role === "admin"
                      ? "bg-amber-500/18 text-amber-200"
                      : "bg-slate-700/60 text-slate-300"
                  }`}
                >
                  {roleLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-400">
                  {monthLabel}
                </span>
              </div>
            </div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block w-full rounded-2xl px-4 py-3 ${
                  isActive(item.path)
                    ? "bg-white/[0.08] font-semibold text-white"
                    : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowCategoryModal(true);
              }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-slate-200"
            >
              + Categoría rápida
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-slate-200 disabled:opacity-50"
            >
              {loggingOut ? "Saliendo..." : "Salir"}
            </button>
          </div>
        </nav>
      )}

      {showCategoryModal ? (
        <AddCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={() => {
            setShowCategoryModal(false);
          }}
        />
      ) : null}
    </div>
  );
}
