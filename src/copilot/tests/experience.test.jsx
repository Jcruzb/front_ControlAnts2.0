import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CopilotAvatar from "../components/CopilotAvatar";
import CopilotPage from "../pages/CopilotPage";
import CopilotService from "../services/CopilotService";
import { blocks } from "./fixtures";

const auth = vi.hoisted(() => ({ value: { user: { id: 1, username: "Juan" }, family: { id: 1 }, authenticated: true } }));
vi.mock("../../hooks/useAuth", () => ({ useAuth: () => auth.value }));
vi.mock("../../hooks/useBudgetMonth", () => ({ useBudgetMonth: () => ({ year: 2026, month: 7, monthLabel: "Julio 2026" }) }));
vi.mock("../services/CopilotService", () => ({ default: { sendIntent: vi.fn(), sendMessage: vi.fn() } }));
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const response = {
  intent: "monthly_summary",
  summary: "Vais por buen camino.",
  period: { year: 2026, month: 7, label: "Julio de 2026" },
  blocks: [blocks.summary_card, blocks.alert, blocks.metric_grid, blocks.action_group],
};

describe("experiencia conversacional de Nilo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.value = { user: { id: 1, username: "Juan" }, family: { id: 1 }, authenticated: true };
    CopilotService.sendIntent.mockResolvedValue(response);
    CopilotService.sendMessage.mockResolvedValue(response);
  });

  it.each([
    "greeting",
    "thinking",
    "analyzing",
    "good-news",
    "attention",
    "concern",
    "celebrating",
  ])("expone de forma accesible el estado %s", (state) => {
    render(<CopilotAvatar state={state} />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/Nilo/);
  });

  it("presenta conclusión e insights antes del detalle", async () => {
    render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    expect(await screen.findByText("Vais por buen camino.")).toBeInTheDocument();
    expect(screen.getByText("Pago pendiente")).toBeInTheDocument();
    const details = screen.getByText("Los datos detrás").closest("details");
    expect(details).not.toHaveAttribute("open");
  });

  it("ejecuta una pregunta rápida como intent del backend", async () => {
    render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    fireEvent.click(screen.getByRole("button", { name: "¿Qué pagos faltan?" }));
    await waitFor(() => expect(CopilotService.sendIntent).toHaveBeenLastCalledWith("pending_payments", { year: 2026, month: 7 }));
  });

  it("envía la conversación escrita sin transformarla", async () => {
    render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    fireEvent.change(screen.getByLabelText("Pregunta para Nilo"), { target: { value: "¿Cómo vamos este mes?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta a Nilo" }));
    await waitFor(() => expect(CopilotService.sendMessage).toHaveBeenCalledWith(
      "¿Cómo vamos este mes?",
      { year: 2026, month: 7 },
    ));
  });
  it("solo escala a IA con el botón explícito y conserva la pregunta", async () => {
    CopilotService.sendMessage.mockRejectedValueOnce({ response: { data: { error: { code: "ai_consent_required" } } } }).mockResolvedValueOnce(response);
    render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    fireEvent.change(screen.getByLabelText("Pregunta para Nilo"), { target: { value: "consulta desconocida" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta a Nilo" }));
    const retry = await screen.findByRole("button", { name: "Consultar con IA" });
    expect(CopilotService.sendMessage).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    await waitFor(() => expect(CopilotService.sendMessage).toHaveBeenLastCalledWith("consulta desconocida", { year: 2026, month: 7 }, { allowAI: true }));
    expect(screen.getByRole("region", { name: "Conversación con Nilo" }).querySelectorAll("li")).toHaveLength(1);
    await screen.findByRole("button", { name: "Ver datos de esta respuesta" });
    expect(screen.queryByRole("button", { name: "Consultar con IA" })).not.toBeInTheDocument();
  });

  it("limita el historial a diez turnos y permite borrarlo", async () => {
    render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    for (let index = 0; index < 11; index += 1) {
      fireEvent.change(screen.getByLabelText("Pregunta para Nilo"), { target: { value: `consulta ${index}` } });
      fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta a Nilo" }));
      await waitFor(() => expect(screen.getByLabelText("Pregunta para Nilo")).not.toBeDisabled());
    }
    const region = screen.getByRole("region", { name: "Conversación con Nilo" });
    expect(region.querySelectorAll("li")).toHaveLength(10);
    expect(region).not.toHaveTextContent("Tú: consulta 0");
    fireEvent.click(screen.getByRole("button", { name: "Borrar conversación" }));
    expect(screen.queryByRole("region", { name: "Conversación con Nilo" })).not.toBeInTheDocument();
  });

  it.each(["user", "family"])("borra historial y consentimiento al cambiar %s", async (field) => {
    CopilotService.sendMessage.mockRejectedValueOnce({ response: { data: { error: { code: "ai_consent_required" } } } });
    const { rerender } = render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    fireEvent.change(screen.getByLabelText("Pregunta para Nilo"), { target: { value: "consulta privada" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta a Nilo" }));
    await screen.findByRole("button", { name: "Consultar con IA" });
    auth.value = { ...auth.value, [field]: { id: 2 } };
    rerender(<MemoryRouter><CopilotPage /></MemoryRouter>);
    expect(screen.queryByRole("region", { name: "Conversación con Nilo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Consultar con IA" })).not.toBeInTheDocument();
    await waitFor(() => expect(CopilotService.sendIntent).toHaveBeenCalledTimes(2));
  });

  it("ignora una respuesta pendiente después de cambiar de familia", async () => {
    let complete;
    CopilotService.sendMessage.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const { rerender } = render(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await screen.findByText("Vais por buen camino.");
    fireEvent.change(screen.getByLabelText("Pregunta para Nilo"), { target: { value: "consulta privada pendiente" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar pregunta a Nilo" }));
    auth.value = { ...auth.value, family: { id: 2 } };
    rerender(<MemoryRouter><CopilotPage /></MemoryRouter>);
    await waitFor(() => expect(CopilotService.sendIntent).toHaveBeenCalledTimes(2));
    complete({ ...response, summary: "Información privada anterior" });
    await waitFor(() => expect(screen.getByLabelText("Pregunta para Nilo")).not.toBeDisabled());
    expect(screen.queryByText("Información privada anterior")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Conversación con Nilo" })).not.toBeInTheDocument();
  });

});
