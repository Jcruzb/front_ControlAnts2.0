import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import MobilePrimaryAction from "../../components/MobilePrimaryAction";
import FloatingCopilot from "../components/FloatingCopilot";

describe("acciones flotantes en móvil", () => {
  it("mantiene separadas la acción prioritaria de gasto y el acceso a Nilo", () => {
    render(
      <MemoryRouter>
        <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
        <FloatingCopilot />
      </MemoryRouter>,
    );

    const expenseAction = screen.getByRole("link", { name: "+ Añadir gasto" });
    const copilotAction = screen.getByRole("link", {
      name: "Abrir a Nilo, tu Copiloto Financiero",
    });

    expect(expenseAction.closest(".fixed")).toHaveClass("z-40");
    expect(copilotAction).toHaveClass(
      "left-[max(1rem,var(--safe-left))]",
      "right-auto",
      "md:left-auto",
      "md:right-[max(1rem,var(--safe-right))]",
    );
  });
});
