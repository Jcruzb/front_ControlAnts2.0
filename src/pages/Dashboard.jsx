import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const Dashboard = () => {
  const navigate = useNavigate()

  const [monthLabel, setMonthLabel] = useState('')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth() + 1

        setMonthLabel(
          today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
        )

        const expenses = await api.get('/expenses', {
          params: { year, month },
        })

        const incomes = await api.get('/incomes', {
          params: { year, month },
        })

        const expensesTotal = expenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0
        )

        const incomesTotal = incomes.reduce(
          (sum, i) => sum + Number(i.amount),
          0
        )

        setTotalExpenses(expensesTotal)
        setTotalIncome(incomesTotal)
      } catch (err) {
        console.log(err)
        setError('No se pudo cargar el resumen del mes')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Cargando resumen del mes…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700">
        {error}
      </div>
    )
  }

  const balance = totalIncome - totalExpenses
  const balancePositive = balance >= 0

  return (
    <section className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold capitalize">
          {monthLabel}
        </h1>
        <p className="text-sm text-gray-500">
          Resumen financiero del mes
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Ingresos */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Ingresos</p>
            <span className="text-xl">💰</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-green-600">
            + {totalIncome.toFixed(2)} €
          </p>
        </div>

        {/* Gastos */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Gastos</p>
            <span className="text-xl">💸</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-red-600">
            − {totalExpenses.toFixed(2)} €
          </p>
        </div>

        {/* Balance */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Balance</p>
            <span className="text-xl">
              {balancePositive ? '📈' : '📉'}
            </span>
          </div>
          <p
            className={`mt-3 text-2xl font-bold ${
              balancePositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {balancePositive ? '+' : ''}
            {balance.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Placeholder for future chart */}
      <div className="rounded-2xl bg-white p-6 border border-dashed text-gray-400 text-sm">
        📊 Próximamente: gráfico de gastos por categoría
      </div>

      {/* Primary action */}
      <div className="pt-2">
        <button
          onClick={() => navigate('/expenses/new')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
        >
          ➕ Añadir gasto
        </button>
      </div>
    </section>
  )
}

export default Dashboard