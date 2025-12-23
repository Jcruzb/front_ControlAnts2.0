const AppLayout = ({ children }) => {
    return (
        <div>
            <header>
                <h2>ControlAnts</h2>
            </header>

            <main>
                {children}
            </main>
        </div>
    )
}

export default AppLayout;
