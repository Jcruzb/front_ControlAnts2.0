import Router from './app/Router'
import { BudgetMonthProvider } from "./context/BudgetMonthProvider";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BudgetMonthProvider>
        <Router />
      </BudgetMonthProvider>
    </AuthProvider>
  )
}

export default App
