import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FinancingPaymentForm } from "../../pages/Financing";
import api from "../../services/api";
vi.mock("../../services/api", () => ({ default: { post: vi.fn() }, getApiErrorMessage: () => "Reintenta" }));
const payment = { name: "Ordenador", purchaseDate: "2026-01-01", row: { id: 7, number: 1, pending_amount: "33.33" } };
it("does not write before review and explicit confirmation, reuses payment key on retry", async () => {
  api.post.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ created: false });
  const saved = vi.fn();
  render(<FinancingPaymentForm payment={payment} members={[]} onSaved={saved} />);
  fireEvent.change(screen.getByLabelText("Importe pagado"), { target: { value: "10,50" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));
  await screen.findByText("Reintenta");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar mismo pago" }));
  await waitFor(() => expect(saved).toHaveBeenCalledOnce());
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
  expect(api.post.mock.calls[0][1].amount).toBe("10.50");
});
it("rejects payment above remaining installment before confirmation", () => {
  render(<FinancingPaymentForm payment={payment} members={[]} />);
  fireEvent.change(screen.getByLabelText("Importe pagado"), { target: { value: "34" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
  expect(screen.getByRole("alert")).toHaveTextContent("no superar el pendiente");
  expect(screen.queryByRole("button", { name: "Confirmar pago" })).toBeNull();
});
it("keeps a successful payment retry idempotent when refreshing the summary fails", async () => {
  api.post.mockReset().mockResolvedValue({ created: true });
  const saved = vi.fn().mockRejectedValueOnce(new Error("refresh failed")).mockResolvedValueOnce();
  render(<FinancingPaymentForm payment={payment} members={[]} onSaved={saved} />);
  fireEvent.click(screen.getByRole("button", { name: "Revisar pago" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar pago" }));
  await screen.findByText("Reintenta");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar mismo pago" }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(2));
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});
