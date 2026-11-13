import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExpenseFinancingModal from "../ExpenseFinancingModal";
import api from "../../services/api";
vi.mock("../../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() }, unwrapCollectionResponse: (data) => data, getApiErrorMessage: (error, fallback) => error?.response?.data?.detail || fallback }));
const expense = { id: 7, amount: "100.00", date: "2026-11-01", category: 3, payer: 2, description: "Ordenador", planned_expense: null, planned_expense_plan: null, recurring_payment: null, is_recurring: false, month: 11 };
const categories = [{ id: 3, name: "Configurada" }];
beforeEach(() => { api.get.mockReset().mockResolvedValue([{ id: 1, name: "Tarjeta familiar" }]); api.post.mockReset(); });
async function open(overrides = {}) {
  const props = { expense, categories, onClose: vi.fn(), onSaved: vi.fn(), ...overrides };
  render(<ExpenseFinancingModal {...props} />);
  await screen.findByRole("option", { name: "Tarjeta familiar" });
  return props;
}
function remaining() {
  fireEvent.change(screen.getByLabelText("Total de la compra, incluido lo ya pagado (€)"), { target: { value: "250,01" } });
  fireEvent.change(screen.getByLabelText("Primera cuota pendiente"), { target: { value: "2026-12-01" } });
}
it("cancels without writes and keeps the payment intact in the preview", async () => {
  const props = await open(); remaining();
  expect(screen.getByText("Ya pagado: 100.00 €")).toBeInTheDocument();
  expect(screen.getByText("Deuda pendiente: 150.01 €")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByText(/No se registrará ningún gasto nuevo/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(props.onClose).toHaveBeenCalledOnce(); expect(api.post).not.toHaveBeenCalled();
});
it("sends only remaining installments, explicit confirmation and the exact existing payment snapshot", async () => {
  const props = await open(); remaining(); api.post.mockResolvedValue({ id: 9 });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  await waitFor(() => expect(props.onSaved).toHaveBeenCalledWith({ id: 9 }));
  const [url, payload] = api.post.mock.calls[0];
  expect(url).toBe("/expenses/7/convert-to-financing/");
  const expected = { ...expense }; delete expected.id;
  expect(payload).toMatchObject({ total_amount: "250.01", installment_count: 3, first_due_date: "2026-12-01", confirmed: true, credit_account: null, expected_expense: expected });
  expect(payload.category).toBeUndefined(); expect(payload.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
});
it("requires a card for a fully paid conversion and never creates pending installments", async () => {
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Selecciona una tarjeta");
  fireEvent.change(screen.getByLabelText("Tarjeta o cuenta"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  api.post.mockResolvedValue({ id: 9 });
  fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledOnce());
  expect(api.post.mock.calls[0][1]).toMatchObject({ total_amount: "100.00", credit_account: 1, installment_count: 0, first_due_date: null });
});
it("rejects decreasing money already paid and zero-cent installments", async () => {
  await open();
  fireEvent.change(screen.getByLabelText("Total de la compra, incluido lo ya pagado (€)"), { target: { value: "99,99" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(screen.getByRole("alert")).toHaveTextContent("no puede ser menor");
  remaining();
  fireEvent.change(screen.getByLabelText("Total de la compra, incluido lo ya pagado (€)"), { target: { value: "100,01" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(screen.getByRole("alert")).toHaveTextContent("al menos un céntimo");
  expect(api.post).not.toHaveBeenCalled();
});
it("requires a later due date but allows historical schedules after the original payment", async () => {
  await open(); remaining();
  fireEvent.change(screen.getByLabelText("Primera cuota pendiente"), { target: { value: expense.date } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(screen.getByLabelText("Primera cuota pendiente")).toBeInvalid();
  expect(screen.queryByRole("button", { name: "Confirmar conversión" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Primera cuota pendiente"), { target: { value: "2026-11-02" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  expect(screen.getByRole("button", { name: "Confirmar conversión" })).toBeInTheDocument();
});
it("freezes an uncertain request and retries the identical body and key", async () => {
  const props = await open(); remaining();
  api.post.mockRejectedValueOnce(new Error("lost response")).mockResolvedValueOnce({ id: 9 });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  await screen.findByRole("button", { name: "Reintentar misma conversión" });
  expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Corregir" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar misma conversión" }));
  await waitFor(() => expect(props.onSaved).toHaveBeenCalledOnce());
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});
it("keeps the same idempotent request when refreshing after success fails", async () => {
  const onSaved = vi.fn().mockRejectedValueOnce(new Error("refresh")).mockResolvedValueOnce();
  await open({ onSaved }); remaining(); api.post.mockResolvedValue({ id: 9 });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  await screen.findByRole("button", { name: "Reintentar misma conversión" });
  fireEvent.click(screen.getByRole("button", { name: "Reintentar misma conversión" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});
it("surfaces a stale expense conflict without pretending conversion succeeded", async () => {
  const props = await open(); remaining();
  api.post.mockRejectedValue({ response: { status: 409, data: { detail: "El gasto ha cambiado. Vuelve a cargarlo." } } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El gasto ha cambiado");
  expect(props.onSaved).not.toHaveBeenCalled(); expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
});
it("uses a configured category for a legacy uncategorized purchase without rewriting the original snapshot", async () => {
  await open({ expense: { ...expense, category: null, recurring_payment: 17, is_recurring: true } }); remaining();
  expect(screen.getByText(/no cancela ni cambia los futuros pagos recurrentes/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Categoría de la compra", { exact: false }), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar conversión" }));
  api.post.mockResolvedValue({ id: 9 }); fireEvent.click(screen.getByRole("button", { name: "Confirmar conversión" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledOnce());
  expect(api.post.mock.calls[0][1]).toMatchObject({ category: 3, expected_expense: { category: null, recurring_payment: 17, is_recurring: true } });
});
it("does not treat failed card loading as an empty successful list", async () => {
  api.get.mockRejectedValue(new Error("offline"));
  render(<ExpenseFinancingModal expense={expense} categories={categories} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar las tarjetas");
  expect(screen.getByRole("button", { name: "Revisar conversión" })).toBeDisabled();
  expect(api.post).not.toHaveBeenCalled();
});
