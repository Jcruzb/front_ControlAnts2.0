import Navbar from "../components/Navbar";

const AppLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
            <header className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
                <Navbar />
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
