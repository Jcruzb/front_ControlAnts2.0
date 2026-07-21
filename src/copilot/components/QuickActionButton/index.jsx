import { memo } from "react";

function QuickActionButton({ label, icon, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex min-h-16 min-w-0 items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.035] px-3.5 py-3 text-left text-sm text-slate-300 transition hover:border-blue-400/20 hover:bg-blue-500/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-50">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/20 text-base text-blue-200 transition group-hover:bg-blue-500/12" aria-hidden="true">{icon}</span>
      <span className="min-w-0 break-words leading-5">{label}</span>
    </button>
  );
}

export default memo(QuickActionButton);
