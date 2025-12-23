//importando navigate
import { useNavigate } from "react-router-dom";

const AppLayout = ({ children }) => {
    const navigate = useNavigate();




    return (
        <div>
            <header>
                <li>
                    <button onClick={() => navigate('/')}>Dashboard</button>
                </li>
                <li>
                    <button onClick={() => navigate('/expenses')}>Expenses List</button>
                </li>
                <li>
                    <button onClick={() => navigate('/expenses/new')}>Add Expense</button>
                </li>
            </header>

            <main>
                {children}
            </main>
        </div>
    )
}

export default AppLayout;
