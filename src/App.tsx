import { useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ScrollToTop from "./components/shared/ScrollToTop";
import { ToastContainer } from "react-toastify";

function App() {
  const routing = useRoutes(Router);

  return (
    <div className="App">
      <ErrorBoundary>
        <ToastContainer
          position="top-right" // top-left, bottom-right, bottom-left
          autoClose={3000} // 3 seconds
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored" // "light" | "dark" | "colored"
        />
        <ScrollToTop>{routing}</ScrollToTop>
      </ErrorBoundary>
    </div>
  );
}

export default App;
