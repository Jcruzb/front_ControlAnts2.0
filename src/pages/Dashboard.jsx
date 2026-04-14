import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage, unwrapCollectionResponse } from '../services/api'
import MonthNavigation from '../components/MonthNavigation'
import QuickAddIncome from '../components/QuickAddIncome'
import { useBudgetMonth } from '../hooks/useBudgetMonth'
import MobilePrimaryAction from '../components/MobilePrimaryAction'

const Dashboard = () => {
  const navigate = useNavigate()
  const {
    currentYear,
    goNextMonth,
    goPrevMonth,
    month,
    monthLabel,
    monthNames,
    resetToCurrentMonth,
    setMonth,
    setYear,
    year,
  } = useBudgetMonth()
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [recentIncomes, setRecentIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const expenses = await api.get('/expenses/', {
          params: { year, month },
        })

        const incomes = await api.get('/incomes/', {
          params: { year, month },
        })

        const normalizedExpenses = unwrapCollectionResponse(expenses)
        const normalizedIncomes = unwrapCollectionResponse(incomes)

        const expensesTotal = normalizedExpenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        )

        const incomesTotal = normalizedIncomes.reduce(
          (sum, i) => sum + Number(i.amount),
          0
        )

        setTotalExpenses(expensesTotal)
        setTotalIncome(incomesTotal)
        setRecentIncomes(
          [...normalizedIncomes]
            .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
            .slice(0, 4)
        )
      } catch (err) {
        console.log(err)
        setError(getApiErrorMessage(err, 'No se pudo cargar el resumen del mes'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month, year])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 text-center text-slate-400 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        Cargando resumen del mes…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[32px] border border-red-400/20 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    )
  }

  const balance = totalIncome - totalExpenses
  const balancePositive = balance >= 0

  return (
    <section className="space-y-8">
      <header className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white capitalize">
            {monthLabel}
          </h1>
          <p className="text-sm text-slate-400">
            Resumen financiero del mes
          </p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:p-5">
          <div className="mx-auto flex w-full justify-center">
            <MonthNavigation
              year={year}
              month={month}
              setYear={setYear}
              setMonth={setMonth}
              monthNames={monthNames}
              goPrevMonth={goPrevMonth}
              goNextMonth={goNextMonth}
              resetToCurrentMonth={resetToCurrentMonth}
              currentYear={currentYear}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Ingresos</p>
            <span className="text-xl text-emerald-300">↗</span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            + {totalIncome.toFixed(2)} €
          </p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Gastos</p>
            <span className="text-xl text-red-300">↘</span>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
            − {totalExpenses.toFixed(2)} €
          </p>
        </div>

        <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">Balance</p>
            <span className={`text-xl ${balancePositive ? 'text-emerald-300' : 'text-red-300'}`}>
              {balancePositive ? '↥' : '↧'}
            </span>
          </div>
          <p
            className={`mt-4 text-3xl font-semibold tracking-tight ${
              balancePositive ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {balancePositive ? '+' : ''}
            {balance.toFixed(2)} €
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Ingresos recientes</h2>
            <p className="text-sm text-slate-400">Últimos movimientos del mes seleccionado</p>
          </div>
          <button
            onClick={() => navigate('/incomes')}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
          >
            Ver todos
          </button>
        </div>

        {recentIncomes.length === 0 ? (
          <p className="rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-slate-400">No hay ingresos registrados este mes.</p>
        ) : (
          <div className="space-y-3">
            {recentIncomes.map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between gap-4 rounded-[28px] border border-white/8 bg-black/20 px-4 py-4"
              >
                <div>
                  <p className="font-medium text-white">
                    {income.category_detail?.name || 'Ingreso'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {income.description || income.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-300">
                    + {Number(income.amount).toFixed(2)} €
                  </p>
                  <p className="text-xs text-slate-500">{income.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={() => navigate('/expenses/new')}
          className="hidden items-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400 md:inline-flex"
        >
          ➕ Añadir gasto
        </button>
        <QuickAddIncome
          year={year}
          month={month}
          onCreated={async () => {
            setLoading(true)
            setError(null)
            try {
              const expenses = await api.get('/expenses/', {
                params: { year, month },
              })

              const incomes = await api.get('/incomes/', {
                params: { year, month },
              })

              const normalizedExpenses = unwrapCollectionResponse(expenses)
              const normalizedIncomes = unwrapCollectionResponse(incomes)

              setTotalExpenses(
                normalizedExpenses.reduce((sum, item) => sum + Number(item.amount), 0)
              )
              setTotalIncome(
                normalizedIncomes.reduce((sum, item) => sum + Number(item.amount), 0)
              )
              setRecentIncomes(
                [...normalizedIncomes]
                  .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
                  .slice(0, 4)
              )
            } catch (err) {
              console.error(err)
              setError(getApiErrorMessage(err, 'No se pudo cargar el resumen del mes'))
            } finally {
              setLoading(false)
            }
          }}
          buttonLabel="➕ Añadir ingreso"
          buttonClassName="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
        />
      </div>

      <MobilePrimaryAction to="/expenses/new" label="+ Añadir gasto" />
    </section>
  )
}

export default Dashboard
