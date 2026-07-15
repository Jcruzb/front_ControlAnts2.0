import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import blockRegistry from "../renderer/registry";
import { blocks } from "./fixtures";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-chart">{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Bar: () => <span />,
  Line: () => <span />,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("bloques visuales del Copiloto", () => {
  it.each(Object.entries(blocks))("renderiza %s y conserva un snapshot", (type, block) => {
    const Component = blockRegistry[type];
    const { container } = render(<Component block={block} />);
    expect(container.firstChild).toMatchSnapshot();
    expect(container).not.toBeEmptyDOMElement();
  });

  it.each(Object.keys(blocks))("muestra estado vacío en %s", (type) => {
    const Component = blockRegistry[type];
    render(<Component block={{ type, id: `empty-${type}` }} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it.each(Object.keys(blocks))("muestra estado error en %s", (type) => {
    const Component = blockRegistry[type];
    render(<Component block={blocks[type]} state="error" error="Fallo controlado" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Fallo controlado");
  });

  it.each(Object.keys(blocks))("muestra estado sin permisos en %s", (type) => {
    const Component = blockRegistry[type];
    render(<Component block={blocks[type]} state="permission" />);
    expect(screen.getByRole("status")).toHaveTextContent(/permisos/i);
  });

  it.each(Object.keys(blocks))("muestra estado de carga en %s", (type) => {
    const Component = blockRegistry[type];
    render(<Component block={blocks[type]} state="loading" />);
    expect(screen.getByLabelText("Cargando bloque")).toBeInTheDocument();
  });

  it("entrega las acciones sin alterar al coordinador", () => {
    const onAction = vi.fn();
    const Component = blockRegistry.action_group;
    render(<Component block={blocks.action_group} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalle" }));
    expect(onAction).toHaveBeenCalledWith(blocks.action_group.actions[0], { blockId: "actions" });
  });

  it("entrega una respuesta rápida con su clave y valor", () => {
    const onAnswer = vi.fn();
    const Component = blockRegistry.question;
    render(<Component block={blocks.question} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: /Vacaciones/ }));
    expect(onAnswer).toHaveBeenCalledWith({ key: "reason", value: "Vacaciones", blockId: "question" });
  });
});
