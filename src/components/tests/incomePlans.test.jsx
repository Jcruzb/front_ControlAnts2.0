import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IncomePlanMonthItem from "../IncomePlanMonthItem";
import RecordIncomeReceiptModal from "../RecordIncomeReceiptModal";
import AdjustIncomePlanModal from "../AdjustIncomePlanModal";

const item = { plan_id: 7, name: "Nómina", planned_amount: "1500.00", status: "PENDING" };
describe("income plan operations", () => {
  it("lets members record a receipt but not change the forecast", () => {
    const onConfirm = vi.fn();
    render(<IncomePlanMonthItem item={item} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar cobro" }));
    expect(onConfirm).toHaveBeenCalledWith(item);
    expect(screen.queryByText("Cambiar importe previsto")).toBeNull();
    expect(screen.getByText("Pendiente de cobrar")).toBeTruthy();
  });
  it("keeps forecast changes available after receipt, without a second receipt", () => {
    render(<IncomePlanMonthItem item={{ ...item, status: "RESOLVED", resolved_income: { amount: "1600", date: "2026-11-10" } }} canManage />);
    expect(screen.queryByRole("button", { name: "Registrar cobro" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cambiar importe previsto" })).toBeTruthy();
    expect(screen.getByText("Cobrado: + 1600.00 €")).toBeTruthy();
  });
  it("lets admins repair a plan without an active version", () => {
    const adjust = vi.fn();
    const missing = { ...item, status: "MISSING_VERSION", planned_amount: null, can_resolve: false };
    render(<IncomePlanMonthItem item={missing} canManage onAdjust={adjust} />);
    expect(screen.queryByRole("button", { name: "Registrar cobro" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cambiar importe previsto" }));
    expect(adjust).toHaveBeenCalledWith(missing);
  });
  it("blocks closed-month actions", () => {
    render(<IncomePlanMonthItem item={item} canManage disabled />);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("submits an exceptional receipt amount and date without recurrence fields", () => {
    const submit = vi.fn();
    render(<RecordIncomeReceiptModal isOpen item={item} budgetYear={2026} budgetMonth={11} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Importe cobrado"), { target: { value: "1620,50" } });
    fireEvent.change(screen.getByLabelText("Fecha de cobro"), { target: { value: "2026-11-12" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar cobro" }));
    expect(submit).toHaveBeenCalledWith({ amount: "1620.50", date: "2026-11-12", description: "" });
  });
  it("requires explicit forecast confirmation for a selected effective month", () => {
    const submit = vi.fn();
    render(<AdjustIncomePlanModal isOpen item={item} budgetYear={2026} budgetMonth={11} onSubmit={submit} />);
    fireEvent.change(screen.getByLabelText("Nuevo importe previsto"), { target: { value: "1700" } });
    fireEvent.change(screen.getByLabelText("Desde el mes"), { target: { value: "2027-01" } });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cambio previsto" }));
    expect(submit).toHaveBeenCalledWith({ amount: "1700.00", year: 2027, month: 1 });
  });
});
