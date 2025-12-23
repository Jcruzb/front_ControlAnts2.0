import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './AppLayout'
import Dashboard from '../pages/Dashboard'
import AddExpense from '../pages/AddExpense'
import ExpensesList from '../pages/ExpensesList'

function Router() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<ExpensesList />} />
          <Route path="/expenses/new" element={<AddExpense />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default Router