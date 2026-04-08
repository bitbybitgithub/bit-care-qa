import { useNavigate, useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ScrollToTop from "./components/shared/ScrollToTop";
import { toast, ToastContainer } from "react-toastify";
import { ApiInterceptor } from "./services/EmrApi";
import { logoutApi } from "./api";
import { useDispatch } from "react-redux";
import { logout } from "./redux";
import { clearSession } from "./context/sessions/userSession";

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  ApiInterceptor.set({
    onAuthError: async () => {
      const res = await logoutApi();
      if (res.success) {
        dispatch(logout()); // clear redux
        clearSession("user");
        navigate("/login");
      } else {
        toast.error(res.error || "Logout failed");
      }
      // window.location.href = "/login";
    },
  });
  const routing = useRoutes(Router);

  return (
    <ErrorBoundary>
      <ToastContainer
        position="top-center" // top-left, bottom-right, bottom-left
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
  );
}
