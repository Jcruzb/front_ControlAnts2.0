# Acciones

Tipos reconocidos: `fetch_detail`, `navigate`, `send_intent`, `submit_answer`, `expand` y `collapse`. No se crean tipos adicionales.

- `fetch_detail` y `send_intent` reenvían exactamente `intent` y `arguments` a `POST /api/assistant/messages/`.
- `navigate` usa exactamente `target` y solo si pertenece a la allowlist compartida con el contrato backend. No concatena ni construye URLs.
- `expand` y `collapse` afectan únicamente a presentación local.
- `submit_answer` no se envía todavía: el DTO backend actual solo admite `message` o `intent + arguments` y `arguments` solo admite año/mes. La UI informa de esta limitación en vez de inventar un contrato de escritura.

La Fase 4 añade preguntas rápidas únicamente para intents ya registrados: resumen mensual, pagos pendientes, gasto por categoría, balance de caja, gasto mensual y gasto por pagador. El input conversacional usa la variante contractual `{message}`; el texto no se clasifica, completa ni corrige en frontend.

Los botones admiten `primary`, `secondary` y `ghost`, tienen foco visible y exponen su estado ocupado.
