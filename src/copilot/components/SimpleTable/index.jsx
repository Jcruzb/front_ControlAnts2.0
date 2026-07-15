import { memo } from "react";
import { BlockHeading, BlockMessage, CopilotSkeleton, blockShell } from "../shared/BlockPrimitives";
import { displayTableValue } from "../../utils/presentation";

function SimpleTable({ block, state = "ready", error }) {
  if (state === "loading") return <CopilotSkeleton />;
  if (state === "error") return <BlockMessage kind="error" title="No se pudo cargar la tabla" message={error} />;
  if (state === "permission") return <BlockMessage kind="permission" title="Tabla no disponible" message="No tienes permisos para ver estos datos." />;
  if (!Array.isArray(block?.rows) || block.rows.length === 0 || !Array.isArray(block.columns) || block.columns.length === 0) return <BlockMessage title={block?.title || "Sin datos"} message="No hay filas para mostrar en este periodo." />;

  const alignment = { left: "text-left", center: "text-center", right: "text-right" };

  return (
    <section className={blockShell} aria-labelledby={`${block.id}-title`}>
      <div id={`${block.id}-title`}><BlockHeading title={block.title} description={block.description} /></div>
      <div className="mt-5 hidden md:block">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead><tr>{block.columns.map((column) => <th key={column.key} scope="col" className={`border-b border-white/10 px-3 py-3 font-medium text-slate-500 ${alignment[column.align] || alignment.left}`}>{column.label}</th>)}</tr></thead>
          <tbody>{block.rows.map((row) => <tr key={row.id}>{block.columns.map((column) => <td key={column.key} className={`break-words border-b border-white/5 px-3 py-4 text-slate-200 ${alignment[column.align] || alignment.left}`}>{displayTableValue(row, column)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="mt-5 grid gap-3 md:hidden">
        {block.rows.map((row) => (
          <article key={row.id} className="min-w-0 rounded-2xl border border-white/8 bg-black/20 p-4">
            <dl className="grid gap-3">
              {block.columns.map((column) => <div key={column.key} className="flex min-w-0 items-start justify-between gap-4"><dt className="text-xs text-slate-500">{column.label}</dt><dd className="min-w-0 break-words text-right text-sm font-medium text-slate-200">{displayTableValue(row, column)}</dd></div>)}
            </dl>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">{block.rows.length} de {block.total_rows} filas{block.has_more ? " · Hay más resultados disponibles" : ""}</p>
    </section>
  );
}

export default memo(SimpleTable);
