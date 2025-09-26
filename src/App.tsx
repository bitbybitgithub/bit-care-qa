import {  useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ScrollToTop from "./components/shared/ScrollToTop";

function App() {
  const routing = useRoutes(Router);

  return (
    <div className="App">
        <ErrorBoundary>
            <ScrollToTop>{routing}</ScrollToTop>
        </ErrorBoundary>
    </div>
  )
}

export default App;
