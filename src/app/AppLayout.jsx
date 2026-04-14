import Navbar from "../components/Navbar";

const AppLayout = ({ children, showNavbar = true }) => {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.16),_transparent_22%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.12),_transparent_18%),linear-gradient(180deg,#0a0d12_0%,#06070a_100%)]">
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
            {showNavbar && (
                <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(8,10,14,0.72)] backdrop-blur-xl">
                    <Navbar />
                </header>
            )}

            <main className="relative mx-auto w-full max-w-[1600px] px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
