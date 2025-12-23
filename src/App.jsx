import { useEffect } from 'react';
import Router from './app/Router'
import { initCSRF } from "./services/api";


function App() {
  useEffect(() => {
    (async () => {
      try {
        await initCSRF();
        console.log("CSRF cookie initialized ✅");
      } catch (e) {
        console.log("CSRF init failed ❌", e);
      }
    })();
  }, []);
  return <Router />
}

export default App