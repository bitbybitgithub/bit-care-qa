import { useNavigate, useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ScrollToTop from "./components/shared/ScrollToTop";
import { toast } from "react-toastify";
import HealthcareToastContainer from "./components/shared/HealthcareToast";
import { ApiInterceptor } from "./services/EmrApi";
import { logoutApi } from "./api";
import { useDispatch } from "react-redux";
import { logout } from "./redux";
import { clearSession } from "./context/sessions/userSession";
import { disconnectSocket } from "./context/socket";

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  ApiInterceptor.set({
    onAuthError: async () => {
      disconnectSocket();
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
      <HealthcareToastContainer />
      <ScrollToTop>{routing}</ScrollToTop>
    </ErrorBoundary>
  );
}
