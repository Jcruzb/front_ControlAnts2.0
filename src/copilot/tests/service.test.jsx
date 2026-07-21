import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../../services/api";
import CopilotService, { ENDPOINT } from "../services/CopilotService";

vi.mock("../../services/api", () => ({ default: { post: vi.fn() } }));

describe("CopilotService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reenvía intent y arguments al mismo endpoint sin transformarlos", async () => {
    const argumentsValue = { year: 2026, month: 7 };
    api.post.mockResolvedValue({ blocks: [] });
    await CopilotService.sendIntent("monthly_summary_detail", argumentsValue);
    expect(api.post).toHaveBeenCalledWith(ENDPOINT, { intent: "monthly_summary_detail", arguments: argumentsValue });
  });

  it("envía la pregunta escrita con el periodo activo sin interpretarla", async () => {
    api.post.mockResolvedValue({ blocks: [] });
    await CopilotService.sendMessage("¿Cómo vamos este mes?", { year: 2026, month: 7 });
    expect(api.post).toHaveBeenCalledWith(ENDPOINT, {
      message: "¿Cómo vamos este mes?",
      context: { year: 2026, month: 7 },
    });
  });
});
