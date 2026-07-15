import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import CopilotService from "../services/CopilotService";
import { ALLOWED_NAVIGATION_TARGETS, COPILOT_ACTION_TYPES } from "../types";

export default function useCopilotActions({ onResponse, onError }) {
  const navigate = useNavigate();
  const [pendingActionId, setPendingActionId] = useState(null);
  const [expandedBlocks, setExpandedBlocks] = useState(() => new Set());

  const executeAction = useCallback(async (action, context = {}) => {
    if (!action || !COPILOT_ACTION_TYPES.includes(action.type)) {
      onError?.("El Copiloto ha recibido una acción no compatible.");
      return;
    }

    if (action.type === "navigate") {
      if (!ALLOWED_NAVIGATION_TARGETS.has(action.target)) {
        onError?.("La ruta solicitada no está permitida.");
        return;
      }
      navigate(action.target);
      return;
    }

    if (action.type === "expand" || action.type === "collapse") {
      const blockId = context.blockId;
      if (!blockId) return;
      setExpandedBlocks((current) => {
        const next = new Set(current);
        if (action.type === "expand") next.add(blockId);
        else next.delete(blockId);
        return next;
      });
      return;
    }

    if (action.type === "submit_answer") {
      onError?.("El contrato backend actual todavía no admite respuestas del usuario.");
      return;
    }

    try {
      setPendingActionId(action.id || `${context.blockId || "action"}:${action.type}`);
      const response = await CopilotService.sendIntent(action.intent, action.arguments);
      onResponse?.(response);
    } catch (error) {
      onError?.(error);
    } finally {
      setPendingActionId(null);
    }
  }, [navigate, onError, onResponse]);

  return { executeAction, pendingActionId, expandedBlocks };
}
