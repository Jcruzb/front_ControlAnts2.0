# Renderer

`CopilotRenderer.jsx` recibe la respuesta completa. Si `response.blocks` existe, recorre la lista, busca `registry[block.type]` y monta el componente. No clasifica, corrige, completa ni reordena bloques.

`registry.js` es el único punto que cambia al incorporar un tipo nuevo. Un tipo desconocido monta `UnknownBlock`; `BlockErrorBoundary` limita un fallo al bloque afectado. `VisibleBlock` difiere el montaje hasta que el bloque entra en el viewport ampliado.

Los estados de carga, vacío, error y falta de permisos son estados de presentación, nunca sustitutos de datos financieros.
