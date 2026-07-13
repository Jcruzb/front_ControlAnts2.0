# Codebase Memory MCP

## Propósito

Codebase Memory MCP mantiene un grafo local de los dos repositorios de ControlAnts 2.0 para localizar símbolos, seguir relaciones, analizar impacto y reducir búsquedas repetitivas. Es una ayuda de descubrimiento: antes de modificar código hay que abrir los archivos reales, comprobar contratos y ejecutar las validaciones pertinentes.

## Instalación actual

- Proyecto oficial: `DeusData/codebase-memory-mcp`.
- Release estable instalada: `v0.8.1`.
- Plataforma: macOS Apple Silicon (`darwin-arm64`).
- Binario: `~/.local/bin/codebase-memory-mcp`.
- Copia versionada del binario: `~/.local/share/codebase-memory-mcp/0.8.1/codebase-memory-mcp`.
- SHA-256 verificado del archivo oficial: `fbd047509852021b5446a11141bcb0a3d1dcaebf6e5112460960f29f052c1c58`.
- SHA-256 del ejecutable instalado: `595cedd259200424f3d92b04e116dc2de4d75bc38ed6a615205ab51ee61de485`.
- Caché e índices locales: `~/.cache/codebase-memory-mcp/`.
- Configuración MCP: `~/.codex/config.toml`, sección `[mcp_servers.codebase-memory-mcp]`.
- Copia previa: `~/.codex/backups/codebase-memory-mcp-20260630/config.toml.before`.
- Copia previa adicional equivalente: `~/.codex/backups/controlants-codebase-memory-mcp/2026-06-30T0931/config.toml.before`.

El instalador automático oficial no se ejecutó. Se auditó el código de la etiqueta `v0.8.1`, se descargó el artefacto fijado, se verificó contra `checksums.txt` y se registró manualmente mediante `codex mcp add`.

## Repositorios indexados

Son dos repositorios Git independientes:

- frontend: `front-controlAnts2.0`;
- backend: `back_ControlAnts2.0`.

La herramienta genera nombres internos a partir de la ruta absoluta. Consultarlos siempre antes de filtrar:

```bash
codebase-memory-mcp cli list_projects
```

En la indexación validada, frontend produjo 536 nodos y 1.215 aristas; backend, 538 nodos y 1.569 aristas. Estas cifras cambian con el código y la documentación indexada.

## Exclusiones

Cada repositorio contiene `.cbmignore`. Se excluyen secretos y entornos locales (`.env*`, claves, credenciales), VCS, dependencias, entornos virtuales, cachés, builds, cobertura, logs, temporales, bases locales, uploads, exports y backups. En backend también se excluye expresamente `core/seeds/users.json`, identificado por la documentación existente como material con credenciales en texto claro.

La herramienta además ignora de forma nativa `.git`, `node_modules`, `venv`, `__pycache__`, `dist` y otros artefactos. Las consultas de validación sobre `.env`, `core/seeds/users.json`, `venv`, `__pycache__`, `node_modules` y `dist` devolvieron cero archivos indexados.

No se activó `persistence: true`; por tanto, no se crea `.codebase-memory/` dentro de los repositorios y los índices no se versionan.

## Comprobar estado y conexión

```bash
codex mcp get codebase-memory-mcp
codebase-memory-mcp --version
codebase-memory-mcp config list
codebase-memory-mcp cli list_projects
codebase-memory-mcp cli index_status '{"project":"<nombre-devuelto-por-list_projects>"}'
```

La validación de protocolo devolvió las 14 herramientas MCP. Una ejecución efímera de Codex consultó ambos índices mediante `list_projects` y `search_graph`, localizando `Expense`, `RecurringPayment`, `Budget` y `Dashboard`.

En `codex exec` no interactivo, Codex requiere aprobar explícitamente las herramientas del servidor para evitar la cancelación automática del prompt de aprobación:

```bash
codex exec --sandbox read-only \
  -c 'mcp_servers.codebase-memory-mcp.default_tools_approval_mode="approve"' \
  'Usa Codebase Memory MCP y lista los proyectos indexados.'
```

No se dejó esa aprobación automática persistida; en sesiones interactivas Codex puede pedir confirmación.

## Indexar y reindexar

Definir las raíces reales y ejecutar:

```bash
FRONTEND_ROOT="/ruta/a/front-controlAnts2.0"
BACKEND_ROOT="/ruta/a/back_ControlAnts2.0"

codebase-memory-mcp cli index_repository "{\"repo_path\":\"$FRONTEND_ROOT\",\"mode\":\"full\"}"
codebase-memory-mcp cli index_repository "{\"repo_path\":\"$BACKEND_ROOT\",\"mode\":\"full\"}"
codebase-memory-mcp config set auto_index true
```

El watcher detectó el alta y la modificación de un archivo temporal, con unos 30 segundos de latencia. No eliminó del grafo el símbolo borrado después de más de un minuto. Una reindexación manual `full` sí lo eliminó inmediatamente. Hasta que upstream corrija esa limitación, reindexar manualmente después de borrados o renombrados relevantes.

## Consultas útiles

Sustituir `<backend>` y `<frontend>` por los nombres de `list_projects`:

```bash
codebase-memory-mcp cli search_graph '{"project":"<backend>","label":"Class","name_pattern":"^(Expense|RecurringPayment|PlannedExpense|PlannedExpensePlan|BudgetService)$"}'

codebase-memory-mcp cli search_graph '{"project":"<backend>","name_pattern":"^(ExpenseSerializer|RecurringPaymentSerializer|ExpenseViewSet|RecurringPaymentViewSet|BudgetView)$"}'

codebase-memory-mcp cli search_code '{"project":"<backend>","pattern":"remaining_amount|difference|pending|paid|total_spent","regex":true,"mode":"files"}'

codebase-memory-mcp cli search_graph '{"project":"<frontend>","name_pattern":"^(Budget|Dashboard|ExpensesList|RecurringPayments|BudgetItem|RecurringPaymentItem|api)$"}'

codebase-memory-mcp cli search_code '{"project":"<frontend>","pattern":"axios|/api/budget|pagado|por pagar|pendiente|diferencia|restante","regex":true,"mode":"files"}'
```

## Resultados y límites observados

- Backend: localizó los modelos `Expense`, `RecurringPayment`, `PlannedExpense` y `PlannedExpensePlan`; `ExpenseSerializer`, serializers de pagos fijos, `ExpenseViewSet`, `RecurringPaymentViewSet`, `BudgetView` y `BudgetService`.
- Frontend: localizó el Axios centralizado en `src/services/api.js`, el consumo de `/budget/` en `Budget.jsx` y `Dashboard.jsx`, `ExpensesList`, `RecurringPayments`, `BudgetItem` y `RecurringPaymentItem`.
- Los términos de estado y totales aparecen en `core/services/budget_service.py`, `Budget.jsx`, `Dashboard.jsx` y `BudgetItem.jsx`, entre otros.
- La comprobación manual confirmó esas ubicaciones y contratos en los archivos reales.
- Falso positivo: hay dos clases llamadas `BudgetView`, una en `core/views/budget_view.py` y otra en `core/serializers/budget_serializer.py`; hay que filtrar por ruta.
- Omisión: la detección de rutas backend devolvió solo nueve rutas, varias inferidas desde tests, y no representó todo el CRUD generado por routers DRF.
- Omisión: el enlace `cross-repo-intelligence` produjo cero aristas HTTP aun existiendo consumidores Axios y rutas backend. Para impacto transversal, combinar búsquedas por endpoint con lectura directa.
- La extracción informó 4 errores de parseo en frontend y 5 en backend sin identificar los archivos en la salida resumida; los símbolos de aceptación sí quedaron disponibles.
- Inconsistencia upstream: el binario informa `0.8.1` con `--version`, pero su respuesta MCP `serverInfo.version` declara `0.10.0`; el código oficial de la etiqueta contiene ese valor hardcodeado. La versión instalada y verificada es la del artefacto `v0.8.1`.
- No se pudo verificar SLSA/cosign localmente porque `gh` y `cosign` no están instalados. La verificación SHA-256 oficial sí se completó.

## Actualizar

Preferir una actualización manual y fijada: revisar la release estable oficial, su instalador/cambios y `checksums.txt`; descargar el artefacto `darwin-arm64`; verificarlo con `shasum -a 256`; hacer copia del binario actual y reemplazarlo solo después de validar `--version`. Después, reiniciar Codex y reindexar ambos repositorios.

La herramienta ofrece `codebase-memory-mcp update`, pero ese atajo no sustituye la revisión y fijación de versión exigida para este proyecto.

## Desactivar, desinstalar y restaurar

Desactivar la integración de Codex sin borrar índices:

```bash
codex mcp remove codebase-memory-mcp
```

Reactivarla:

```bash
codex mcp add codebase-memory-mcp -- "$HOME/.local/bin/codebase-memory-mcp"
```

Desinstalación completa, después de revisar las rutas:

```bash
codex mcp remove codebase-memory-mcp
rm "$HOME/.local/bin/codebase-memory-mcp"
rm -rf "$HOME/.cache/codebase-memory-mcp"
```

Para restaurar la configuración anterior, comparar primero el backup porque puede haber cambios posteriores:

```bash
diff -u "$HOME/.codex/backups/codebase-memory-mcp-20260630/config.toml.before" "$HOME/.codex/config.toml"
cp "$HOME/.codex/backups/codebase-memory-mcp-20260630/config.toml.before" "$HOME/.codex/config.toml"
```

El segundo comando restaura el archivo completo y descartará cualquier configuración añadida después del backup; normalmente es más seguro usar `codex mcp remove codebase-memory-mcp`.
