import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CopilotRenderer from "../renderer/CopilotRenderer";
import blockRegistry from "../renderer/registry";
import { blocks } from "./fixtures";

describe("CopilotRenderer", () => {
  it("expone el catálogo contractual completo", () => {
    expect(Object.keys(blockRegistry)).toEqual(Object.keys(blocks));
  });

  it("renderiza por registro y no falla ante tipos desconocidos", () => {
    render(<CopilotRenderer response={{ blocks: [blocks.summary_card, { id: "future", type: "future_block" }] }} />);
    expect(screen.getByText("Vais dentro del presupuesto")).toBeInTheDocument();
    expect(screen.getByText("Bloque no compatible")).toBeInTheDocument();
  });

  it("muestra estados globales sin interpretar la respuesta", () => {
    const { rerender } = render(<CopilotRenderer loading />);
    expect(screen.getAllByLabelText("Cargando bloque")).toHaveLength(3);
    rerender(<CopilotRenderer response={{ blocks: [] }} />);
    expect(screen.getByText("Sin información para mostrar")).toBeInTheDocument();
  });
});
