import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../services/api";
import { getCategories } from "../services/categories";
import { getFamilyMembers } from "../services/familyMembers";
import { getTodayLocalDate } from "../utils/date";
import AddCategoryModal from "../components/AddCategoryModal";
import PayerSelect from "../components/PayerSelect";
import { parseAmount } from "../utils/amounts";

const AddExpense = () => {
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [payer, setPayer] = useState("");
  const [date, setDate] = useState(getTodayLocalDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [payers, setPayers] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [payersError, setPayersError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);


  useEffect(() => {
    const loadFormOptions = async () => {
      setLoadingCategories(true);
      setCategoriesError(null);
      setPayersError(null);
      try {
        const [categoriesData, payersData] = await Promise.all([
          getCategories(),
          getFamilyMembers().catch((loadPayersError) => {
            console.error(loadPayersError);
            setPayersError(
              getApiErrorMessage(
                loadPayersError,
                "No se pudieron cargar los pagadores"
              )
            );
            return [];
          }),
        ]);
        setCategories(categoriesData);
        setPayers(payersData);
      } catch (loadError) {
        console.error(loadError);
        setCategoriesError(
          getApiErrorMessage(loadError, "No se pudieron cargar las categorías")
        );
      } finally {
        setLoadingCategories(false);
      }
    };
    loadFormOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseAmount(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Introduce un importe válido mayor que 0");
      return;
    }
    if (!String(category).trim()) {
      setError("La categoría es obligatoria");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        description,
        amount: parsedAmount.toFixed(2),
        category,
        date,
      };
      if (payer) {
        payload.payer = Number(payer);
      }

      await api.post("/expenses/", payload);

      navigate("/expenses");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo guardar el gasto"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
          Nuevo gasto
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Añadir gasto</h1>
        <p className="text-sm text-slate-400">
          Apunta un gasto que ya has realizado
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[36px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm sm:p-8"
      >
        <div className="space-y-2">
          <span className="text-sm text-slate-400">Importe</span>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-[28px] border border-white/10 bg-black/20 px-5 py-5 text-3xl font-semibold tracking-tight text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
              required
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-slate-500">€</span>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="¿En qué fue el gasto? (Supermercado, Netflix…) "
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/50"
          />
        </div>

        <div className="space-y-1">
          <span className="text-sm text-slate-400">Categoría</span>

          {loadingCategories ? (
            <p className="text-sm text-slate-500">Cargando categorías…</p>
          ) : categoriesError ? (
            <div className="space-y-3 rounded-[24px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              <p>{categoriesError}</p>
              <button
                type="button"
                onClick={() => {
                  setCategoriesError(null);
                  setLoadingCategories(true);
                  getCategories()
                    .then((data) => setCategories(data))
                    .catch((loadError) => {
                      console.error(loadError);
                      setCategoriesError(
                        getApiErrorMessage(
                          loadError,
                          "No se pudieron cargar las categorías"
                        )
                      );
                    })
                    .finally(() => setLoadingCategories(false));
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.1]"
              >
                Reintentar
              </button>
            </div>
          ) : categories.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="w-full rounded-[24px] border border-dashed border-white/12 bg-black/20 py-3 text-sm text-blue-200 transition hover:bg-white/[0.03]"
            >
              ➕ Crear primera categoría
            </button>
          ) : (
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setShowCategoryModal(true);
                } else {
                  setCategory(e.target.value);
                }
              }}
              required
              className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-blue-400/50"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
              <option value="__new__">➕ Crear nueva categoría</option>
            </select>
          )}
        </div>

        <div>
          <PayerSelect
            value={payer}
            onChange={setPayer}
            payers={payers}
            disabled={loadingCategories}
          />
          {payersError ? (
            <p className="mt-2 text-xs text-amber-200">
              {payersError}. Puedes guardar sin seleccionar pagador.
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <span className="text-sm text-slate-400">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-blue-400/50"
          />
        </div>


        {error && (
          <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[24px] bg-blue-500 py-3 text-lg font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar gasto"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full text-sm text-slate-400 transition hover:text-slate-200"
          >
            Cancelar
          </button>
        </div>
      </form>

      {showCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={(newCategory) => {
            setCategories((prev) => [...prev, newCategory]);
            setCategory(newCategory.id);
            setShowCategoryModal(false);
          }}
        />
      )}
    </section>
  );
};

export default AddExpense;
