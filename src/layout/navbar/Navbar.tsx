import React, { useState } from "react";
import { Box, AppBar, Toolbar, styled, IconButton } from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutApi } from "../../api";
import {
  clearSession,
  getSessionItem,
} from "../../context/sessions/userSession";
import { logout } from "../../redux";
import { FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-toastify";

import { SIDEBAR_MENUS } from "../../context/constant/sidebarMenus";
import { EntityType } from "../../context/constant/enum";
import type { Role } from "../../types/common/sidebarTypes";

interface HeaderProps {
  onMenuClick: () => void;
}

const AppBarStyled = styled(AppBar)(() => ({
  background: "var(--color-surface-alt)",
  borderBottom: "2px solid var(--color-primary)",
  boxShadow: "var(--shadow-lg)",
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
  const userrole = getSessionItem("user", "role");
  const entity_type = getSessionItem("user", "entity_type");
  const entity = entity_type as EntityType;
  const role = userrole as Role;

  const currentMenu = SIDEBAR_MENUS[entity]?.[role]?.find(
    (menu) => menu.link === location.pathname,
  );

  const title = currentMenu?.title || "Home";

  const handleLogout = async () => {
    setAnimatingOut(true);

    try {
      const res = await logoutApi();

      if (res.success) {
        dispatch(logout());
        clearSession("user");
        navigate("/login");
      } else {
        toast.error(res.error || "Logout failed");
      }
    } catch (err) {
      toast.error("Network error");
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
        {/* Mobile Menu */}
        <IconButton color="inherit" onClick={onMenuClick} className="md:hidden">
          <MenuIcon className="text-[var(--color-text)]" size={22} />
        </IconButton>

        {/* Page Title */}
        <h1
          className="font-bold text-[var(--color-primary)] ml-2 md:ml-0 flex-grow"
          style={{
            fontSize: "var(--font-h3)",
          }}
        >
          {title}
        </h1>

        {/* Logout */}
        <button
          onClick={() => setShowConfirm(true)}
          className="flex cursor-pointer items-center bg-[var(--color-surface-alt)] gap-2 border-2 border-[var(--color-error)] text-[var(--color-error)] hover:text-[var(--color-surface-alt)] px-4 py-2 rounded-xl hover:bg-[var(--color-error)] transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </ToolbarStyled>

      {/* Logout Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex justify-center items-start pt-10 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              animatingOut ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleCancel}
          />

          <div
            className={`relative bg-[var(--color-surface-alt)] border border-gray-200 shadow-xl rounded-xl p-6 w-[90%] max-w-md transform transition-all duration-300 ${
              animatingOut
                ? "-translate-y-10 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <h2 className="text-xl font-semibold text-[var(--color-text)] flex items-center gap-2">
              <FaSignOutAlt />
              Confirm Logout
            </h2>

            <p className="text-[var(--color-text)] mt-2">
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
                className="px-5 py-2 bg-[var(--color-error)] text-[var(--color-white)] rounded-lg hover:opacity-80 transition cursor-pointer"
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
