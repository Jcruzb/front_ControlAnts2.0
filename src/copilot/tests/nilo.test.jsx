import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Nilo from "../../components/Nilo";
import { NILO_STATES, normalizeNiloState, resolveNiloSize } from "../../components/Nilo/niloConfig";
import NiloLab from "../../pages/NiloLab";

describe("Nilo character system", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("expone todos los estados del sistema", () => {
    expect(NILO_STATES).toEqual([
      "greeting",
      "satisfied",
      "thinking",
      "analyzing",
      "waiting",
      "surprised",
      "concerned",
      "alert",
      "celebrating",
      "idle",
    ]);
  });

  it("normaliza eventos de producto a expresiones", () => {
    expect(normalizeNiloState("loading")).toBe("thinking");
    expect(normalizeNiloState("good_news")).toBe("celebrating");
    expect(normalizeNiloState("warning")).toBe("concerned");
    expect(normalizeNiloState("unknown")).toBe("idle");
  });

  it.each([
    ["xs", "32px"],
    ["sm", "64px"],
    ["md", "128px"],
    ["lg", "256px"],
    ["xl", "512px"],
    [96, "96px"],
  ])("resuelve la escala %s del personaje", (size, expected) => {
    expect(resolveNiloSize(size)).toBe(expected);
  });

  it("aplica estado, tamaño y preferencias de presentación", () => {
    render(<Nilo state="warning" size={64} showAura={false} showShadow={false} animate reducedMotion />);
    const nilo = screen.getByRole("img", { name: /preocupado/i });
    expect(nilo).toHaveAttribute("data-state", "concerned");
    expect(nilo).toHaveAttribute("data-aura", "false");
    expect(nilo).toHaveAttribute("data-shadow", "false");
    expect(nilo).toHaveAttribute("data-animate", "false");
    expect(nilo).toHaveStyle({ "--nilo-size": "64px" });
    expect(nilo.querySelector(".nilo-character-image")).toHaveAttribute("src", "/nilo-character.png");
  });

  it("es operable por teclado y saluda al activarlo", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    render(<Nilo state="waiting" interactive onClick={onClick} />);
    const nilo = screen.getByRole("button", { name: /espera con calma/i });
    fireEvent.click(nilo);
    expect(onClick).toHaveBeenCalledOnce();
    expect(nilo).toHaveClass("nilo-is-waving");
    act(() => vi.advanceTimersByTime(1000));
    expect(nilo).not.toHaveClass("nilo-is-waving");
  });

  it("sigue el cursor sin iniciar un bucle permanente", () => {
    vi.stubGlobal("requestAnimationFrame", (callback) => { callback(); return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    render(<Nilo state="greeting" interactive reducedMotion={false} />);
    const nilo = screen.getByRole("button", { name: /saluda/i });
    nilo.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON() {} });
    fireEvent.pointerMove(nilo, { clientX: 75, clientY: 25 });
    expect(nilo.style.getPropertyValue("--nilo-look-x")).not.toBe("0px");
    fireEvent.pointerLeave(nilo);
    expect(nilo.style.getPropertyValue("--nilo-look-x")).toBe("");
  });

  it("permite cambiar manualmente de estado en el laboratorio", () => {
    render(<NiloLab />);
    fireEvent.click(screen.getByRole("button", { name: /Sorprendido/ }));
    expect(screen.getByText("Cian · ojos amplios · cabeza elevada")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Nilo está sorprendido").length).toBeGreaterThan(0);
  });
});
