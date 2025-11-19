import React, { useState } from "react";
import { Box, AppBar, Toolbar, styled, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutApi } from "../../api/LogoutApi";
import { clearSession } from "../../context/sessions/userSession";
import { logout } from "../../redux";
import { FaSignOutAlt } from "react-icons/fa";

interface HeaderProps {
  onMenuClick: () => void;
}

const AppBarStyled = styled(AppBar)(() => ({
  background: "var(--color-bg)",
  borderBottom: "2px solid var(--color-primary)",
}));

const ToolbarStyled = styled(Toolbar)(() => ({
  width: "100%",
  paddingLeft: "16px",
  paddingRight: "16px",
}));

const Navbar: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Convert path into readable title
  const formatTitleHeader = (path: string) => {
    const cleanedPath = path.replace(/^\/|\/$/g, "");
    const words = cleanedPath.split(/[-/]+/);
    const formatted = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    return formatted || "Home";
  };

  const title = formatTitleHeader(location.pathname);

  const handleLogout = async () => {
    setAnimatingOut(true);
    try {
      const res = await logoutApi();
      if (res.success) {
        dispatch(logout());
        clearSession("user");
        navigate("/login");
      } else {
        alert(res.error || "Logout failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setShowConfirm(false);
      setAnimatingOut(false);
    }
  };

  const handleCancel = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setShowConfirm(false);
      setAnimatingOut(false);
    }, 250);
  };

  return (
    <AppBarStyled position="sticky" elevation={0}>
      <ToolbarStyled className="!pl-2">
        {/* -------- LEFT: Mobile Menu Icon -------- */}
        <IconButton
          color="inherit"
          onClick={onMenuClick}
          className="md:hidden "
        >
          <MenuIcon className="text-[var(--color-text)]" size={22} />
        </IconButton>

        {/* -------- CENTER: Title (flex-grow pushes logout to right) -------- */}
        <h1 className="text-xl font-bold text-[var(--color-primary)] ml-2 md:ml-0 flex-grow">
          {title}
        </h1>

        {/* -------- RIGHT: Logout Button -------- */}
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 bg-[var(--color-error)] text-[var(--color-white)] px-4 py-2 rounded-xl hover:bg-red-600 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </ToolbarStyled>

      {/* -------- LOGOUT MODAL -------- */}
      {showConfirm && (
        <div className="fixed inset-0 flex justify-center items-start pt-10 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              animatingOut ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleCancel}
          />

          <div
            className={`relative bg-[var(--color-white)] border border-gray-200 shadow-xl rounded-xl p-6 w-[90%] max-w-md transform transition-all duration-300 ${
              animatingOut
                ? "-translate-y-10 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text)] flex items-center gap-2">
              <FaSignOutAlt />
              Confirm Logout
            </h2>

            <p className="text-gray-600 mt-2">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-text)] hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-[var(--color-error)] text-[var(--color-white)] rounded-lg hover:opacity-80 transition  cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </AppBarStyled>
  );
};

export default Navbar;
