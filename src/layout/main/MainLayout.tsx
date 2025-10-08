import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import { FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice"; 

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showConfirm, setShowConfirm] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // convert path into readable title
  const getTitleFromPath = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");
  };

  const title = getTitleFromPath(location.pathname);

  const handleLogout = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setShowConfirm(false);
      dispatch(logout());
      navigate("/login");
    }, 300); 
  };

  const handleCancel = () => {
    setAnimatingOut(true);
    setTimeout(() => setShowConfirm(false), 300);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-16 md:w-1/5 rounded-r-3xl min-w-[60px] md:min-w-[200px] max-w-xs transition-all duration-300">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-3 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mt-2 bg-white p-4 ml-6 mr-6 shadow rounded-2xl">
          <h1 className="text-2xl font-bold">{title}</h1>
          <button
            onClick={() => {
              setAnimatingOut(false);
              setShowConfirm(true);
            }}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-2xl shadow hover:bg-red-600 transition"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {/* Page content */}
        <Outlet />
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
            className={`relative bg-white border border-gray-200 shadow-xl rounded-xl p-6 w-[90%] max-w-md transform transition-all duration-300 ${
              animatingOut
                ? "-translate-y-10 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaSignOutAlt className="text-red-500" /> Confirm Logout
            </h2>
            <p className="text-gray-600 mt-2">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;