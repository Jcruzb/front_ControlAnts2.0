import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Budget from "../../pages/Budget";
import { createIncomePlan, confirmIncomePlan, recordIncomeReceipt, getIncomePlansMonth } from "../../services/incomePlans";

vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ profile: { role: "admin" } }) }));
const period = vi.hoisted(() => ({ month: 11 }));
vi.mock("../../hooks/useBudgetMonth", () => ({ useBudgetMonth: () => ({ year: 2026, month: period.month, currentYear: 2026, monthLabel: "Noviembre 2026", monthNames: Array(12).fill("Mes"), goNextMonth: vi.fn(), goPrevMonth: vi.fn(), resetToCurrentMonth: vi.fn(), setMonth: vi.fn(), setYear: vi.fn() }) }));
vi.mock("../../services/api", () => ({ default: { get: vi.fn(async (url) => url === "/budget/" ? { month_id: 9, recurring: [], planned: [], total_planned: "0", total_spent: "0" } : []) }, unwrapCollectionResponse: (data) => data, getApiErrorMessage: () => "Error" }));
vi.mock("../../services/categories", () => ({ getCategories: vi.fn(async () => []) }));
vi.mock("../../services/familyMembers", () => ({ getFamilyMembers: vi.fn(async () => []) }));
vi.mock("../../services/incomePlans", () => ({ getIncomePlansMonth: vi.fn(async () => ({ month: { is_closed: false }, results: [] })), createIncomePlan: vi.fn(async () => ({ id: 7 })), confirmIncomePlan: vi.fn(), recordIncomeReceipt: vi.fn(), changeIncomePlanAmount: vi.fn(), deleteIncomePlan: vi.fn(), updateIncomePlan: vi.fn() }));
vi.mock("../CreateIncomePlanModal", () => ({ default: ({ isOpen, onSubmit }) => isOpen ? <button onClick={() => onSubmit({ categoryId: "2", amount: "1500", name: "Nómina", planType: "ONGOING" })}>Enviar plan de prueba</button> : null }));

it("creating an income plan refreshes the page without recording any receipt", async () => {
  render(<MemoryRouter><Budget /></MemoryRouter>);
  await screen.findByText("+ Crear ingreso recurrente");
  fireEvent.click(screen.getByText("+ Crear ingreso recurrente"));
  fireEvent.click(screen.getByText("Enviar plan de prueba"));
  await waitFor(() => expect(createIncomePlan).toHaveBeenCalledWith(expect.objectContaining({ planned_amount: "1500.00", start_month: 9 })));
  await waitFor(() => expect(screen.queryByText("Enviar plan de prueba")).toBeNull());
  expect(confirmIncomePlan).not.toHaveBeenCalled();
  expect(recordIncomeReceipt).not.toHaveBeenCalled();
});

beforeEach(() => {
  vi.clearAllMocks();
  period.month = 11;
  getIncomePlansMonth.mockResolvedValue({ month: { is_closed: false }, results: [] });
});

it.each(["Registrar cobro", "Cambiar importe previsto"])("closes %s when the selected month changes", async (action) => {
  getIncomePlansMonth.mockResolvedValue({ month: { is_closed: false }, results: [{ plan_id: 7, name: "Nómina", planned_amount: "1500.00", status: "PENDING" }] });
  const { rerender } = render(<MemoryRouter><Budget /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: action }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  period.month = 12;
  rerender(<MemoryRouter><Budget /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(recordIncomeReceipt).not.toHaveBeenCalled();
});

it("closes plan creation when the selected month changes", async () => {
  const { rerender } = render(<MemoryRouter><Budget /></MemoryRouter>);
  fireEvent.click(await screen.findByText("+ Crear ingreso recurrente"));
  expect(screen.getByText("Enviar plan de prueba")).toBeInTheDocument();
  period.month = 12;
  rerender(<MemoryRouter><Budget /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByText("Enviar plan de prueba")).not.toBeInTheDocument());
  expect(createIncomePlan).not.toHaveBeenCalled();
});
