import { memo, useEffect, useRef, useState } from "react";
import "./nilo.css";
import { normalizeNiloState, resolveNiloSize } from "./niloConfig";

const STATE_LABELS = Object.freeze({
  greeting: "Nilo te saluda",
  satisfied: "Nilo está satisfecho",
  thinking: "Nilo está pensando",
  analyzing: "Nilo está analizando",
  waiting: "Nilo espera con calma",
  surprised: "Nilo está sorprendido",
  concerned: "Nilo está preocupado",
  alert: "Nilo quiere llamar tu atención",
  celebrating: "Nilo está celebrando contigo",
  idle: "Nilo está descansando",
});

function useReducedMotion(override) {
  const [systemPreference, setSystemPreference] = useState(false);

  useEffect(() => {
    if (typeof override === "boolean" || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemPreference(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [override]);

  return typeof override === "boolean" ? override : systemPreference;
}

function Nilo({
  state = "idle",
  size = "md",
  interactive = false,
  showAura = true,
  showShadow = true,
  animate = true,
  reducedMotion,
  className = "",
  ariaLabel,
  onClick,
}) {
  const normalizedState = normalizeNiloState(state);
  const reduceMotion = useReducedMotion(reducedMotion);
  const rootRef = useRef(null);
  const pointerFrame = useRef(null);
  const reactionTimer = useRef(null);
  const [waving, setWaving] = useState(false);
  const motionEnabled = animate && !reduceMotion;

  useEffect(() => () => {
    window.cancelAnimationFrame(pointerFrame.current);
    window.clearTimeout(reactionTimer.current);
  }, []);

  function setLook(x, y) {
    const node = rootRef.current;
    if (!node) return;
    node.style.setProperty("--nilo-look-x", `${x * 1.2}px`);
    node.style.setProperty("--nilo-look-y", `${y * 0.8}px`);
    node.style.setProperty("--nilo-tilt", `${x * 1.4}deg`);
    node.style.setProperty("--nilo-lift", `${y * -0.8}px`);
  }

  function handlePointerMove(event) {
    if (!interactive || !motionEnabled) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    window.cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = window.requestAnimationFrame(() => setLook(x, y));
  }

  function handlePointerLeave() {
    window.cancelAnimationFrame(pointerFrame.current);
    const node = rootRef.current;
    if (!node) return;
    node.style.removeProperty("--nilo-look-x");
    node.style.removeProperty("--nilo-look-y");
    node.style.removeProperty("--nilo-tilt");
    node.style.removeProperty("--nilo-lift");
  }

  function handleActivation(event) {
    if (!interactive) return;
    setWaving(true);
    window.clearTimeout(reactionTimer.current);
    reactionTimer.current = window.setTimeout(() => setWaving(false), 1000);
    onClick?.(event);
  }

  const Element = interactive ? "button" : "div";
  const elementProps = interactive ? { type: "button", onClick: handleActivation } : { role: "img" };
  const label = ariaLabel || STATE_LABELS[normalizedState];

  return (
    <Element
      {...elementProps}
      ref={rootRef}
      className={`nilo ${waving ? "nilo-is-waving" : ""} ${className}`}
      style={{ "--nilo-size": resolveNiloSize(size) }}
      data-state={normalizedState}
      data-aura={showAura}
      data-shadow={showShadow}
      data-animate={motionEnabled}
      aria-label={label}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <span className="nilo-halo" aria-hidden="true">
        <span className="nilo-halo-core" />
        <span className="nilo-halo-ring nilo-halo-ring-one" />
        <span className="nilo-halo-ring nilo-halo-ring-two" />
        <span className="nilo-particle nilo-particle-one" />
        <span className="nilo-particle nilo-particle-two" />
        <span className="nilo-particle nilo-particle-three" />
        <span className="nilo-particle nilo-particle-four" />
      </span>

      <span className="nilo-character-stage" aria-hidden="true">
        <span className="nilo-ground-shadow" />
        <img className="nilo-character-image" src="/nilo-character.png" alt="" draggable="false" />
      </span>

      <span className="nilo-celebration" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </span>
    </Element>
  );
}

export default memo(Nilo);
