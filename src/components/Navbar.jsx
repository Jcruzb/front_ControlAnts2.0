import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  {
    label: "Presupuesto",
    path: "/",
    primary: true,
  },
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Gastos",
    path: "/expenses",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and context */}
        <div className="flex flex-col">
          <div className="font-bold text-xl text-blue-700">ControlAnts</div>
          <div className="text-sm text-gray-500">
            Familia: <span className="font-medium">CruzPa</span> | Mes:{" "}
            <span className="font-medium">Junio 2024</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 font-medium text-gray-700"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`hover:text-blue-700 transition-colors ${
                isActive(item.path)
                  ? "text-blue-700 border-b-2 border-blue-700 pb-1"
                  : ""
              }`}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/expenses/new"
            className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Añadir gasto
          </Link>
        </nav>

        {/* Mobile button */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-gray-300 bg-white shadow-sm"
        >
          <div className="flex flex-col px-5 py-4 gap-4 font-medium text-gray-700">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block w-full ${
                  isActive(item.path)
                    ? "text-blue-700 font-semibold"
                    : "hover:text-blue-700"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/expenses/new"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-center text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Añadir gasto
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}