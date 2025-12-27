import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './AppLayout'
import Dashboard from '../pages/Dashboard'
import AddExpense from '../pages/AddExpense'
import ExpensesList from '../pages/ExpensesList'
import Budget from '../pages/Budget'
import RecurringPayments from '../pages/RecurringPayments'

function Router() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Budget />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesList />} />
          <Route path="/expenses/new" element={<AddExpense />} />
          <Route path="/recurring" element={<RecurringPayments />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default Router