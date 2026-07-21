import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import Nilo from "../../../components/Nilo";

function FloatingCopilot() {
  const location = useLocation();
  if (location.pathname === "/copilot") return null;

  return (
    <Link to="/copilot" aria-label="Abrir a Nilo, tu Copiloto Financiero" className="group fixed bottom-[calc(var(--safe-bottom)+1rem)] right-[max(1rem,var(--safe-right))] z-30 flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(10,14,22,0.9)] p-1.5 pr-3 shadow-[0_18px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
      <Nilo state="greeting" size="floating" animate showShadow={false} ariaLabel="Nilo te saluda" />
      <span className="hidden text-xs font-semibold text-slate-300 sm:block">Habla con Nilo</span>
    </Link>
  );
}

export default memo(FloatingCopilot);
