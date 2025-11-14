import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { FaSignOutAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import { logoutApi } from "../../api/LogoutApi";
import { useLoader } from "../../context/LoaderContext";
import Loader from "../../components/shared/Loader/Loader";
import {
  clearSession,
  getSession,
  getSessionItem,
} from "../../context/sessions/userSession";
import { SocketProvider } from "../../context/SocketContext";
import { TokenManager } from "../../api/auth/tokenManager";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useLoader();

  const [showConfirm, setShowConfirm] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const token = TokenManager.getAccessToken();
  useEffect(() => {
    const userSession = getSession("user");
    if (!userSession) {
      window.location.href = "/login";
    }
  }, [token]);

  const clinicId = getSessionItem("user", "clinic_id");
  const doctorId = getSessionItem("user", "doctor_id");

  // convert path into readable title
  function formatTitleHeader(path: string) {
    const cleanedPath = path.replace(/^\/|\/$/g, "");
    const words = cleanedPath.split(/[-/]+/);
    const formatted = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return formatted || "Home";
  }

  const title = formatTitleHeader(location.pathname);
  console.log({ title });

  // const handleLogout = () => {
  //   setAnimatingOut(true);
  //   setTimeout(() => {
  //     setShowConfirm(false);
  //     dispatch(logout());
  //     navigate("/login");
  //   }, 300);
  // };

  const handleLogout = async () => {
    setAnimatingOut(true);

    try {
      const res = await logoutApi();
      if (res.success) {
        dispatch(logout()); // clear redux
        clearSession("user");
        navigate("/login");
      } else {
        alert(res.error || "Logout failed");
        setAnimatingOut(false);
      }
    } catch (err) {
      console.error(err);
      alert("Logout failed due to network error");
      setAnimatingOut(false);
    } finally {
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setAnimatingOut(true);
    setTimeout(() => setShowConfirm(false), 300);
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <div className="flex h-screen bg-[var(--color-surface)] ">
          {/* Sidebar */}
          <div className="w-16 md:w-1/5 rounded-r-3xl min-w-[60px] md:min-w-[200px] max-w-xs transition-all duration-300">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[var(--color-surface)] p-3 overflow-auto">
            {/* Header */}
            <div className="flex justify-between items-center mt-2 bg-[var(--color-bg)] p-4 ml-6 mr-6 shadow rounded-2xl">
              <h1 className="text-2xl font-bold">{title}</h1>
              <button
                onClick={() => {
                  setAnimatingOut(false);
                  setShowConfirm(true);
                }}
                className="flex items-center gap-2 bg-[var(--color-error)] text-[var(--color-white)] px-4 py-2 rounded-2xl shadow hover:bg-red-600 transition"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>

            {/* Page content */}
            <SocketProvider
              token={token}
              clinicId={clinicId}
              doctorId={doctorId}
            >
              <Outlet />
            </SocketProvider>
          </div>

          {/* Logout Confirmation Modal */}
          {showConfirm && (
            <div className="fixed inset-0 flex justify-center items-start pt-10 z-50">
              {/* Dark overlay */}
              <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
                  animatingOut ? "opacity-0" : "opacity-100"
                }`}
                onClick={handleCancel}
              ></div>

              {/* Modal Box */}
              <div
                className={`relative bg-[var(--color-surface)] border border-gray-200 shadow-xl rounded-xl p-6 w-[90%] max-w-md transform transition-all duration-300 ${
                  animatingOut
                    ? "-translate-y-10 opacity-0"
                    : "translate-y-0 opacity-100"
                }`}
              >
                <h2 className="text-xl font-semibold text-[var(--color-primary)] flex items-center gap-2">
                  <FaSignOutAlt className="text-[var(--color-primary)]" />{" "}
                  Confirm Logout
                </h2>
                <p className="text-[var(--color-text)] mt-2">
                  Are you sure you want to logout?
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2 rounded-lg border border-[var(--color-primary)] hover:opacity-80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 bg-[var(--color-error)] text-white rounded-lg shadow0 hover:opacity-80  transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MainLayout;
