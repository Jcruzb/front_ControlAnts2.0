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
        console.log(incomes)

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
    return <p>Cargando resumen del mes…</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  const balance = totalIncome - totalExpenses

  return (
    <section>
      {/* Contexto */}
      <h1>{monthLabel}</h1>

      {/* Estado financiero */}
      <div style={{ marginTop: '1rem' }}>
        <p>Ingresos: + {totalIncome.toFixed(2)} €</p>
        <p>Gastos: − {totalExpenses.toFixed(2)} €</p>
        <hr />
        <p>
          <strong>
            Balance: {balance >= 0 ? '+' : ''}
            {balance.toFixed(2)} €
          </strong>
        </p>
      </div>

      {/* Acciones */}
      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/expenses/new')}>
          ➕ Añadir gasto
        </button>
      </div>
    </section>
  )
}

export default Dashboard