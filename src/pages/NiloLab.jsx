import { useState } from "react";
import Nilo from "../components/Nilo";
import { NILO_STATES } from "../components/Nilo/niloConfig";

const STATE_COPY = Object.freeze({
  greeting: ["Saludando", "Azul · mirada abierta · antena y brazo levantados"],
  satisfied: ["Satisfecho", "Verde · ojos sonrientes · postura relajada"],
  thinking: ["Pensando", "Azul violeta · mirada lateral · cejas asimétricas"],
  analyzing: ["Analizando", "Cian · exploración ocular · señal activa"],
  waiting: ["Esperando", "Aura neutra · postura estable · antenas abiertas"],
  surprised: ["Sorprendido", "Cian · ojos amplios · cabeza elevada"],
  concerned: ["Preocupado", "Amarillo · cejas suaves · antenas bajas"],
  alert: ["Alerta", "Naranja · atención firme sin agresividad"],
  celebrating: ["Celebrando", "Morado · ojos sonrientes · brazos y partículas"],
  idle: ["Idle", "Respiración lenta · ojos cerrados · aura tenue"],
});

const SIZE_OPTIONS = [
  ["xs", "32 px"],
  ["sm", "64 px"],
  ["md", "128 px"],
  ["lg", "256 px"],
  ["xl", "512 px"],
];

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-300">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-blue-500" />
    </label>
  );
}

export default function NiloLab() {
  const [state, setState] = useState("greeting");
  const [size, setSize] = useState("lg");
  const [interactive, setInteractive] = useState(true);
  const [showAura, setShowAura] = useState(true);
  const [showShadow, setShowShadow] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const displaySize = size === "xl" ? "min(512px, 78vw)" : size;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl pb-20">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">ControlAnts Character System</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Nilo · Laboratorio de personaje</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">Prueba cada expresión, escala y preferencia sin depender de datos financieros. Mueve el cursor sobre Nilo y púlsalo para activar el saludo.</p>
      </header>

      <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
        <section className="relative flex min-h-[28rem] min-w-0 items-center justify-center overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.09),transparent_56%),rgba(255,255,255,0.018)] p-5 sm:min-h-[36rem]" aria-label="Vista previa interactiva de Nilo">
          <div className="absolute left-5 top-5 rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-xs text-slate-500">{STATE_COPY[state][0]} · {SIZE_OPTIONS.find(([value]) => value === size)?.[1]}</div>
          <Nilo state={state} size={displaySize} interactive={interactive} showAura={showAura} showShadow={showShadow} animate={animate} reducedMotion={reducedMotion} />
        </section>

        <aside className="min-w-0 rounded-[26px] border border-white/8 bg-white/[0.025] p-4 sm:p-5" aria-label="Controles de Nilo">
          <h2 className="text-sm font-semibold text-white">Configuración</h2>
          <div className="mt-4 grid gap-2">
            <Toggle label="Interactivo" checked={interactive} onChange={setInteractive} />
            <Toggle label="Halo" checked={showAura} onChange={setShowAura} />
            <Toggle label="Sombra" checked={showShadow} onChange={setShowShadow} />
            <Toggle label="Animaciones" checked={animate} onChange={setAnimate} />
            <Toggle label="Forzar movimiento reducido" checked={reducedMotion} onChange={setReducedMotion} />
          </div>

          <fieldset className="mt-6">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tamaño</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SIZE_OPTIONS.map(([value, label]) => <button key={value} type="button" onClick={() => setSize(value)} className={`min-h-10 rounded-xl border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${size === value ? "border-blue-400/30 bg-blue-500/12 text-blue-100" : "border-white/8 bg-black/15 text-slate-500 hover:text-slate-200"}`}>{label}</button>)}
            </div>
          </fieldset>

          <div className="mt-6 rounded-2xl border border-white/6 bg-black/15 p-4">
            <p className="text-sm font-semibold text-slate-200">{STATE_COPY[state][0]}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{STATE_COPY[state][1]}</p>
          </div>
        </aside>
      </div>

      <section className="mt-8" aria-labelledby="states-title">
        <h2 id="states-title" className="text-xl font-semibold tracking-tight text-white">Sistema completo de expresiones</h2>
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {NILO_STATES.map((value) => (
            <button key={value} type="button" onClick={() => setState(value)} aria-pressed={state === value} className={`min-w-0 rounded-[20px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${state === value ? "border-cyan-400/25 bg-cyan-500/[0.07]" : "border-white/7 bg-white/[0.025] hover:border-white/14"}`}>
              <div className="flex justify-center"><Nilo state={value} size={64} animate={animate} reducedMotion={reducedMotion} showShadow={false} /></div>
              <p className="mt-2 truncate text-xs font-semibold text-slate-200">{STATE_COPY[value][0]}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[26px] border border-white/8 bg-white/[0.02] p-4 sm:p-6" aria-labelledby="scale-title">
        <h2 id="scale-title" className="text-xl font-semibold tracking-tight text-white">Silueta y escalabilidad</h2>
        <p className="mt-2 text-sm text-slate-500">La misma geometría vectorial, sin assets alternativos por tamaño.</p>
        <div className="mt-6 flex min-w-0 flex-wrap items-end justify-around gap-6">
          {[32, 64, 128, 256].map((value) => <div key={value} className="text-center"><Nilo state={state} size={value} animate={false} showShadow={value >= 64} /><p className="mt-3 text-xs text-slate-600">{value}px</p></div>)}
        </div>
        <div className="mt-8 flex max-w-full flex-col items-center overflow-hidden border-t border-white/6 pt-8"><Nilo state={state} size="min(512px, 82vw)" animate={false} /><p className="mt-3 text-xs text-slate-600">512px</p></div>
      </section>

      <section className="mt-8 rounded-[24px] border border-blue-400/12 bg-blue-500/[0.04] p-5 text-sm leading-7 text-slate-400">
        <h2 className="font-semibold text-slate-100">API reutilizable</h2>
        <code className="mt-3 block overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-blue-200">{'<Nilo state="thinking" size="lg" interactive showAura showShadow animate />'}</code>
      </section>
    </div>
  );
}
