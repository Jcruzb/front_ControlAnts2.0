import { useEffect, useState } from "react";

export default function BulkImportModal({
  isOpen,
  onClose,
  title,
  description,
  instructions = [],
  previewColumns = [],
  onDownloadTemplate,
  onParseFile,
  onConfirm,
  confirmLabel = "Guardar registros",
  templateLabel = "Descargar plantilla",
  emptyPreviewMessage = "Carga un archivo para ver la vista previa.",
}) {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [previewRows, setPreviewRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFileName("");
      setPreviewRows([]);
      setParseErrors([]);
      setParseError(null);
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    setSelectedFileName(file?.name || "");
    setPreviewRows([]);
    setParseErrors([]);
    setParseError(null);
    setSaveError(null);

    if (!file) {
      return;
    }

    try {
      setParsing(true);
      const result = await onParseFile(file);
      setPreviewRows(result.rows || []);
      setParseErrors(result.errors || []);
    } catch (error) {
      console.error(error);
      setParseError(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo leer el archivo Excel."
      );
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  }

  async function handleConfirm() {
    try {
      setSaving(true);
      setSaveError(null);
      await onConfirm(previewRows);
      onClose();
    } catch (error) {
      console.error(error);
      setSaveError(
        error instanceof Error && error.message
          ? error.message
          : "No se pudo completar la importacion masiva."
      );
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    previewRows.length > 0 &&
    parseErrors.length === 0 &&
    !parsing &&
    !saving;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex min-h-full items-end sm:items-center sm:justify-center">
        <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0d1117] shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:max-h-[calc(100vh-2rem)]">
        <div className="flex flex-col gap-4 border-b border-white/8 px-5 pb-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Importacion masiva</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>
            <p className="max-w-2xl text-sm text-slate-400">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-start rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08]"
          >
            Cerrar
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden px-5 pb-5 sm:px-6 sm:pb-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4 overflow-y-auto pt-5 xl:pr-1">
            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Flujo
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {instructions.map((item, index) => (
                  <p key={`${item}-${index}`}>
                    {index + 1}. {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  {templateLabel}
                </button>

                <label className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-center text-sm text-slate-300 transition hover:bg-white/[0.05]">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  Seleccionar archivo Excel
                </label>

                <p className="min-h-5 text-xs text-slate-500">
                  {selectedFileName || "Aun no se ha cargado ningun archivo."}
                </p>
              </div>
            </div>

            {parseError ? (
              <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {parseError}
              </div>
            ) : null}

            {saveError ? (
              <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                {saveError}
              </div>
            ) : null}

            {parseErrors.length > 0 ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <p className="font-semibold">Hay filas con errores</p>
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto text-xs text-amber-100/90">
                  {parseErrors.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <section className="flex min-h-0 flex-col rounded-[28px] border border-white/8 bg-white/[0.04] p-4 xl:my-5">
            <div className="flex flex-col gap-3 border-b border-white/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Vista previa
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {parsing
                    ? "Procesando archivo..."
                    : previewRows.length > 0
                    ? `${previewRows.length} filas listas para importar`
                    : emptyPreviewMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canSave}
                className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Guardando..." : `${confirmLabel} (${previewRows.length})`}
              </button>
            </div>

            {previewRows.length > 0 ? (
              <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    Columnas: {previewColumns.length}
                  </span>
                  <span>
                    Filas cargadas: {previewRows.length}
                  </span>
                </div>

                <div className="min-h-[20rem] flex-1 overflow-auto rounded-[24px] border border-white/8 bg-black/20">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead className="sticky top-0 z-10 bg-[#11161d] shadow-[0_10px_24px_rgba(0,0,0,0.28)]">
                    <tr>
                      {previewColumns.map((column) => (
                        <th
                          key={column.key}
                          className="whitespace-nowrap px-3 py-3 text-left text-[11px] uppercase tracking-[0.18em] text-slate-500"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.previewKey} className="bg-black/20">
                        {previewColumns.map((column) => (
                          <td
                            key={column.key}
                            className="whitespace-nowrap px-3 py-3 text-sm text-slate-200 first:rounded-l-2xl last:rounded-r-2xl"
                          >
                            {row[column.key] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex min-h-[20rem] flex-1 items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-slate-500">
                {emptyPreviewMessage}
              </div>
            )}
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
