import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useBudgetMonth } from "../../hooks/useBudgetMonth";
import Nilo from "../../components/Nilo";
import ActionGroup from "../components/ActionGroup";
import ConversationInput from "../components/ConversationInput";
import CopilotGreeting from "../components/CopilotGreeting";
import CopilotHeader from "../components/CopilotHeader";
import QuickActionButton from "../components/QuickActionButton";
import { BlockMessage } from "../components/shared/BlockPrimitives";
import useCopilotActions from "../hooks/useCopilotActions";
import CopilotRenderer from "../renderer/CopilotRenderer";
import CopilotService from "../services/CopilotService";

const QUICK_ACTIONS = Object.freeze([
  { id: "quick-summary", label: "¿Cómo vamos este mes?", icon: "↗", intent: "monthly_summary" },
  { id: "quick-pending", label: "¿Qué pagos faltan?", icon: "○", intent: "pending_payments" },
  { id: "quick-categories", label: "¿En qué gastamos más?", icon: "◇", intent: "category_spending" },
  { id: "quick-cash", label: "¿Cuánto dinero queda?", icon: "€", intent: "monthly_cash_balance" },
  { id: "quick-spending", label: "¿Cuánto hemos gastado?", icon: "—", intent: "monthly_spending" },
  { id: "quick-payers", label: "¿Quién ha pagado?", icon: "◎", intent: "payer_spending" },
]);

const INSIGHT_TYPES = new Set(["alert", "recommendation"]);

function avatarStateFromStatus(status) {
  if (status === "positive") return "good-news";
  if (status === "attention") return "attention";
  if (status === "negative" || status === "critical") return "concern";
  return "greeting";
}

export default function CopilotPage() {
  const { user, profile } = useAuth();
  const { year, month, monthLabel } = useBudgetMonth();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [error, setError] = useState(null);
  const [interactionError, setInteractionError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [avatarState, setAvatarState] = useState("thinking");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const analysisTimer = useRef(null);

  const userName = user?.first_name?.trim() || profile?.name?.trim() || user?.username || "";

  const categorized = useMemo(() => {
    const blocks = Array.isArray(response?.blocks) ? response.blocks : [];
    const summaryBlock = blocks.find((block) => block?.type === "summary_card") || null;
    const insightCandidates = blocks.filter((block) => INSIGHT_TYPES.has(block?.type));
    const insightBlocks = insightCandidates.slice(0, 3);
    const actionBlocks = blocks.filter((block) => block?.type === "action_group");
    const detailBlocks = blocks.filter((block) => block !== summaryBlock && !insightBlocks.includes(block) && block?.type !== "action_group");
    return { summaryBlock, insightBlocks, actionBlocks, detailBlocks };
  }, [response]);

  const insightResponse = useMemo(() => ({ ...response, blocks: categorized.insightBlocks }), [categorized.insightBlocks, response]);
  const detailResponse = useMemo(() => ({ ...response, blocks: categorized.detailBlocks }), [categorized.detailBlocks, response]);
  const periodLabel = response?.period?.label || monthLabel;
  const greetingSummary = response?.summary || categorized.summaryBlock?.headline || "";

  const showAnalyzedResponse = useCallback((nextResponse) => {
    window.clearTimeout(analysisTimer.current);
    setResponse(nextResponse);
    setError(null);
    setInteractionError(null);
    setPermissionDenied(false);
    setAvatarState("analyzing");
    setDetailsOpen(String(nextResponse?.intent || "").endsWith("_detail"));
    const summaryBlock = nextResponse?.blocks?.find((block) => block?.type === "summary_card");
    analysisTimer.current = window.setTimeout(() => {
      setAvatarState(avatarStateFromStatus(summaryBlock?.status));
    }, 850);
  }, []);

  const handlePageError = useCallback((requestError) => {
    setPermissionDenied(requestError?.response?.status === 403);
    setError(getApiErrorMessage(requestError, "No se pudo consultar el Copiloto Financiero."));
    setAvatarState("attention");
  }, []);

  const handleInteractionError = useCallback((requestError) => {
    const message = typeof requestError === "string" ? requestError : getApiErrorMessage(requestError, "Nilo no ha podido responder a esa pregunta.");
    setInteractionError(message);
    setAvatarState("attention");
  }, []);

  const { executeAction, pendingActionId } = useCopilotActions({ onResponse: showAnalyzedResponse, onError: handleInteractionError });
  const busy = loading || interacting || Boolean(pendingActionId);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setInteractionError(null);
      setPermissionDenied(false);
      setAvatarState("thinking");
      const nextResponse = await CopilotService.sendIntent("monthly_summary", { year, month });
      showAnalyzedResponse(nextResponse);
    } catch (requestError) {
      handlePageError(requestError);
    } finally {
      setLoading(false);
    }
  }, [handlePageError, month, showAnalyzedResponse, year]);

  useEffect(() => {
    loadSummary();
    return () => window.clearTimeout(analysisTimer.current);
  }, [loadSummary]);

  async function handleQuickAction(item) {
    setInteractionError(null);
    setAvatarState("thinking");
    await executeAction({ id: item.id, type: "send_intent", label: item.label, intent: item.intent, arguments: { year, month }, style: "secondary" }, { blockId: "quick-actions" });
  }

  async function handleMessage(message) {
    try {
      setInteracting(true);
      setInteractionError(null);
      setAvatarState("thinking");
      const nextResponse = await CopilotService.sendMessage(message);
      showAnalyzedResponse(nextResponse);
    } catch (requestError) {
      handleInteractionError(requestError);
    } finally {
      setInteracting(false);
    }
  }

  const stateLabel = loading || interacting ? "Revisando tus finanzas" : avatarState === "analyzing" ? "Preparando lo importante" : "Tu hormiga financiera";

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl pb-24 sm:pb-16">
      <CopilotHeader stateLabel={stateLabel} onRefresh={loadSummary} refreshing={loading} />

      <div className="mt-5 grid min-w-0 gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(22rem,1.15fr)] md:items-center md:gap-8 lg:gap-12">
        <section className="flex min-w-0 flex-col items-center text-center">
          <Nilo state={avatarState} size="hero" interactive ariaLabel={`Nilo: ${stateLabel}`} />
          <div className="-mt-5 w-full sm:-mt-7">
            <CopilotGreeting name={userName} periodLabel={periodLabel} summary={greetingSummary} description={categorized.summaryBlock?.description} loading={loading} />
          </div>
        </section>

        <section className="min-w-0" aria-labelledby="insights-title">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-300">Lo que Nilo ha visto</p>
              <h1 id="insights-title" className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">Únicamente lo importante</h1>
            </div>
            {categorized.insightBlocks.length ? <span className="shrink-0 text-xs text-slate-600">{categorized.insightBlocks.length} insights</span> : null}
          </div>

          {loading ? (
            <div className="grid gap-3" aria-label="Nilo está buscando insights"><div className="h-28 animate-pulse rounded-[22px] bg-white/[0.04]" /><div className="h-28 animate-pulse rounded-[22px] bg-white/[0.03]" /></div>
          ) : error || permissionDenied ? (
            <BlockMessage kind={permissionDenied ? "permission" : "error"} title={permissionDenied ? "Nilo no puede consultar estos datos" : "Nilo no ha podido revisar el mes"} message={error} />
          ) : categorized.insightBlocks.length ? (
            <CopilotRenderer response={insightResponse} onAction={executeAction} pendingActionId={pendingActionId} />
          ) : (
            <div className="rounded-[22px] border border-emerald-400/12 bg-emerald-500/[0.04] p-5 text-sm leading-6 text-slate-400" role="status">No hay avisos adicionales. La conclusión principal está en el mensaje de Nilo.</div>
          )}
        </section>
      </div>

      <section className="mt-10 min-w-0" aria-labelledby="quick-actions-title">
        <div className="mb-3">
          <h2 id="quick-actions-title" className="text-sm font-semibold text-slate-200">Preguntas rápidas</h2>
          <p className="mt-1 text-xs text-slate-500">Atajos respaldados por el motor de ControlAnts.</p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((item) => <QuickActionButton key={item.id} label={item.label} icon={item.icon} disabled={busy || permissionDenied} onClick={() => handleQuickAction(item)} />)}
        </div>
        {categorized.actionBlocks.map((block) => <ActionGroup key={block.id} block={block} onAction={executeAction} pendingActionId={pendingActionId} />)}
      </section>

      <div className="mt-9">
        <ConversationInput onSubmit={handleMessage} disabled={busy || permissionDenied} error={interactionError} />
      </div>

      {!loading && !error && categorized.detailBlocks.length ? (
        <details className="mt-8 min-w-0 rounded-[24px] border border-white/7 bg-black/10 p-1" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-[20px] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 [&::-webkit-details-marker]:hidden">
            <span><span className="text-slate-100">Los datos detrás</span><span className="ml-2 font-normal text-slate-600">Solo si quieres profundizar</span></span>
            <span className={`text-slate-600 transition ${detailsOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
          </summary>
          <div className="grid min-w-0 gap-4 p-2 pt-3 sm:p-3">
            <CopilotRenderer response={detailResponse} onAction={executeAction} onAnswer={() => handleInteractionError("El contrato backend actual todavía no admite respuestas del usuario.")} pendingActionId={pendingActionId} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
