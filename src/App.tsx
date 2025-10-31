import { useNavigate, useRoutes } from "react-router-dom";
import Router from "./routes/Router";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ScrollToTop from "./components/shared/ScrollToTop";
import { ToastContainer } from "react-toastify";
import { ApiInterceptor } from "./api";
import { logoutApi } from "./api/LogoutApi";
import { useDispatch } from "react-redux";
import { logout } from "./redux";
import { clearSession, getSession } from "./context/sessions/userSession";
import useClientIp from "./hooks/useClientIp";
import { useEffect } from "react";
import { TokenManager } from "./api/auth/tokenManager";

export default function App() {
  const dispatch=useDispatch();
  const navigate=useNavigate();


ApiInterceptor.set({
  onAuthError: async() => {
      const res = await logoutApi();
        if (res.success) {
          dispatch(logout()); // clear redux
          clearSession("user");
          navigate("/login");
        } else {
          alert(res.error || "Logout failed");
        }       
    // window.location.href = "/login";
  },
  
});
  const routing = useRoutes(Router);

  const { ip } = useClientIp();
useEffect(() => {
  if (ip) sessionStorage.setItem("client_ip", ip);
}, [ip]);

useEffect(() => {
  const sessionUser = getSession("user");
  if (sessionUser && ip) {
    (async () => {
      await TokenManager.rehydrate();
    })();
  }
}, [ip]);

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