import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CopilotAvatar from "../components/CopilotAvatar";
import CopilotPage from "../pages/CopilotPage";
import CopilotService from "../services/CopilotService";
import { blocks } from "./fixtures";

vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ user: { username: "Juan" }, profile: null }) }));
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
});
