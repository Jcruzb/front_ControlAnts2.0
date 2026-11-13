import { it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Financing from "../../pages/Financing";
import api from "../../services/api";
vi.mock("../../hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 }, family: { id: 1 }, authenticated: true, profile: { role: "admin" } }) }));
vi.mock("../../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() }, getApiErrorMessage: () => "Error de conexión", unwrapCollectionResponse: (data) => data }));
vi.mock("../../services/categories", () => ({ getCategories: vi.fn(async () => [{ id: 3, name: "Compras" }]) }));
vi.mock("../../services/familyMembers", () => ({ getFamilyMembers: vi.fn(async () => []) }));
beforeEach(() => { api.get.mockReset().mockResolvedValue([]); api.post.mockReset(); });
async function fillPurchase() {
  render(<Financing />);
  await screen.findByText("Añadir tarjeta o compra");
  fireEvent.click(screen.getByText("Añadir tarjeta o compra"));
  fireEvent.change(screen.getByLabelText("Compra"), { target: { value: "Ordenador" } });
  fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("Total a devolver (€)"), { target: { value: "100" } });
}
it("freezes ambiguous creation and retries the same purchase key and payload", async () => {
  api.post.mockRejectedValueOnce(new Error("response lost")).mockResolvedValueOnce({ id: 1 });
  await fillPurchase();
  fireEvent.click(screen.getByRole("button", { name: "Crear compra y calendario" }));
  await screen.findByText("Error de conexión");
  expect(screen.getByLabelText("Compra")).toBeDisabled();
  expect(screen.getByLabelText("Total a devolver (€)")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar misma compra" }));
  await waitFor(() => expect(screen.getByLabelText("Compra")).toHaveValue(""));
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
  expect(api.post.mock.calls[0][1].idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
});
it("retains the key when POST succeeded but refreshing purchases failed", async () => {
  api.post.mockResolvedValue({ id: 1 });
  await fillPurchase();
  api.get.mockRejectedValueOnce(new Error("refresh lost"));
  fireEvent.click(screen.getByRole("button", { name: "Crear compra y calendario" }));
  await screen.findByText("Error de conexión");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar misma compra" }));
  await waitFor(() => expect(screen.getByLabelText("Compra")).toHaveValue(""));
  expect(api.post.mock.calls[0]).toEqual(api.post.mock.calls[1]);
});
it("allows correcting a definitively rejected request", async () => {
  api.post.mockRejectedValue({ response: { status: 400 } });
  await fillPurchase();
  fireEvent.click(screen.getByRole("button", { name: "Crear compra y calendario" }));
  await screen.findByText("Error de conexión");
  expect(screen.getByLabelText("Compra")).not.toBeDisabled();
});
