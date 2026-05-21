---
name: controlants-frontend-patterns
description: Use this skill for ControlAnts React implementation tasks involving API calls, state/loading/error handling, forms, modals, amount parsing, categories, payers, imports/exports, and shared frontend conventions.
---

# ControlAnts Frontend Patterns Skill

## Data Loading Pattern

Use page-local state unless a shared context already owns the data.

```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/endpoint/", { params });
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err, "Mensaje amigable"));
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [dependencies]);
```

## API Rules

- Use `src/services/api.js` and existing service modules.
- `api` already unwraps `.data`; do not double unwrap unless inspecting a local helper.
- Use `unwrapCollectionResponse` for paginated-or-array responses.
- Use `getApiErrorMessage` for user-facing errors.
- Preserve existing endpoints and payload fields unless the task explicitly changes contracts.
- For month-aware endpoints, use `year/month` from `BudgetMonthProvider`.

## Forms

Keep controlled forms:

```jsx
const [form, setForm] = useState({ field: "" });
const handleChange = (field) => (event) => {
  setForm((current) => ({ ...current, [field]: event.target.value }));
};
```

For amount inputs:

- Keep the input as string while editing.
- Prefer `type="text"` with `inputMode="decimal"` when comma decimals matter.
- Normalize with `parseAmount` / `normalizeDecimalInput` from `src/utils/amounts.js`.
- Send backend amounts as strings with dot decimal, e.g. `amount.toFixed(2)`.

## Modals

Expected modal behavior:

- Fixed overlay with `z-50 inset-0`.
- Dark overlay `bg-black/40`.
- Mobile bottom sheet: `rounded-t-2xl`.
- Desktop centered modal: `sm:rounded-2xl`.
- Do not close during active save unless the component already supports it.
- Show backend errors inside the modal, not only in console.

## Categories

Categories may arrive as:

- `category`
- `category_name`
- `category_detail`

Prefer helpers from `src/utils/categories.js`:

- `buildCategoryMap`
- `getCategoryDisplayName`
- `getCategoryDisplayIcon`
- `getCategoryDisplayColor`

Do not classify an item as `Sin categoría` until these forms and the category map fail.

## Payers

`payer` is optional. If absent, omit it from payload and let backend fallback.

Display name fallback:

1. `name`
2. `full_name`
3. `username`
4. `email`
5. `Pagador #id`

Use `getPayerDisplayName` from `src/utils/payers.js`.

## Excel Import/Export

Reuse:

- `src/components/BulkImportModal.jsx`
- `src/utils/spreadsheet.js`

Keep date/amount parsing centralized where possible. Validate rows before posting.

## Validation

After code changes:

- `npm run lint`
- `npm run build`
