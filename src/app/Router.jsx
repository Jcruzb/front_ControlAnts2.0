import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './AppLayout'
import Dashboard from '../pages/Dashboard'
import AddExpense from '../pages/AddExpense'
import ExpensesList from '../pages/ExpensesList'
import IncomesList from '../pages/IncomesList'
import Budget from '../pages/Budget'
import RecurringPayments from '../pages/RecurringPayments'
import Account from '../pages/Account'
import Login from '../pages/Login'
import Register from '../pages/Register'
import { useAuth } from '../hooks/useAuth'

function AuthLoadingScreen() {
  return (
    <AppLayout showNavbar={false}>
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-slate-500">
        Comprobando sesión...
      </div>
    </AppLayout>
  )
}

function PrivateRoute({ children }) {
  const location = useLocation()
  const { authenticated, initialized } = useAuth()

  if (!initialized) {
    return <AuthLoadingScreen />
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <AppLayout>{children}</AppLayout>
}

function PublicOnlyRoute({ children }) {
  const { authenticated, initialized } = useAuth()

  if (!initialized) {
    return <AuthLoadingScreen />
  }

  if (authenticated) {
    return <Navigate to="/" replace />
  }

  return <AppLayout showNavbar={false}>{children}</AppLayout>
}

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/" element={<PrivateRoute><Budget /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/expenses" element={<PrivateRoute><ExpensesList /></PrivateRoute>} />
        <Route path="/incomes" element={<PrivateRoute><IncomesList /></PrivateRoute>} />
        <Route path="/expenses/new" element={<PrivateRoute><AddExpense /></PrivateRoute>} />
        <Route path="/recurring" element={<PrivateRoute><RecurringPayments /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
