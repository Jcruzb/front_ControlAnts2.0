import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../services/api";
import { useBudgetMonth } from "../../hooks/useBudgetMonth";
import useCopilotActions from "../hooks/useCopilotActions";
import CopilotRenderer from "../renderer/CopilotRenderer";
import CopilotService from "../services/CopilotService";

export default function CopilotPage() {
  const { year, month, monthLabel } = useBudgetMonth();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleError = useCallback((value) => {
    if (typeof value === "string") {
      setError(value);
      return;
    }
    setPermissionDenied(value?.response?.status === 403);
    setError(getApiErrorMessage(value, "No se pudo consultar el Copiloto Financiero."));
  }, []);

  const handleResponse = useCallback((nextResponse) => {
    setError(null);
    setPermissionDenied(false);
    setResponse(nextResponse);
  }, []);

  const { executeAction, pendingActionId } = useCopilotActions({ onResponse: handleResponse, onError: handleError });

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      const nextResponse = await CopilotService.sendIntent("monthly_summary", { year, month });
      setResponse(nextResponse);
    } catch (requestError) {
      handleError(requestError);
    } finally {
      setLoading(false);
    }
  }, [handleError, month, year]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <header className="mb-6 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" aria-hidden="true" />
            Copiloto Financiero
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Tu economía, de un vistazo</h1>
          <p className="mt-2 text-sm text-slate-400">Resumen de {monthLabel}. Datos preparados por ControlAnts.</p>
        </div>
        <button type="button" onClick={loadSummary} disabled={loading} className="min-h-11 self-start rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50 sm:self-auto">
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      <CopilotRenderer response={response} loading={loading} error={permissionDenied ? null : error} permissionDenied={permissionDenied} onAction={executeAction} onAnswer={() => handleError("El contrato backend actual todavía no admite respuestas del usuario.")} pendingActionId={pendingActionId} />
    </div>
  );
}
