import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { logoutApi } from "../../api";
import {
  clearSession,
  getSessionItem,
} from "../../context/sessions/userSession";
import { logout } from "../../redux";
import { toast } from "react-toastify";
import { SIDEBAR_MENUS } from "../../context/constant/sidebarMenus";
import { EntityType } from "../../context/constant/enum";
import type { Role } from "../../types/common/sidebarTypes";
import {
  Menu,
  LogOut,
  ChevronRight,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  const userrole = getSessionItem("user", "role");
  const entity_type = getSessionItem("user", "entity_type");
  const full_name = getSessionItem("user", "full_name");

  const entity = entity_type as EntityType;
  const role = userrole as Role;

  // Resolve current active title based on path matching
  const menuList = role && entity ? SIDEBAR_MENUS[entity]?.[role] ?? [] : [];
  const currentMenu = menuList.find(
    (menu) =>
      menu.link === location.pathname ||
      (menu.link !== "/" && location.pathname.startsWith(menu.link + "/")) ||
      (menu.link !== "/" && location.pathname.startsWith(menu.link))
  );

  const formatPathToTitle = (pathname: string): string => {
    const segment = pathname.split("/").filter(Boolean).pop();
    if (!segment) return "Dashboard";
    return segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const title = currentMenu?.title || formatPathToTitle(location.pathname);

  const getPortalLabel = (type: EntityType | null): string => {
    switch (type) {
      case EntityType.Clinic:
        return "Clinic";
      case EntityType.Lab:
        return "Lab";
      case EntityType.Pharmacy:
        return "Pharmacy";
      case EntityType.Doctor:
        return "Doctor";
      case EntityType.Support:
        return "Support";
      default:
        return "Healthcare";
    }
  };

  const getInitials = (name: string, roleName: string | null): string => {
    if (!name || !name.trim()) {
      return roleName ? roleName.slice(0, 2).toUpperCase() : "BC";
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const portalLabel = getPortalLabel(entity);
  const initials = getInitials(full_name || "", role);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

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
    } catch {
      toast.error("Network error during logout");
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
    }, 200);
  };

  return (
    <>
      <header className="h-16 px-4 md:px-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs z-30 transition-colors">
        {/* ================= Left: Clean Breadcrumb Only ================= */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile-only menu toggle (hidden on desktop) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle navigation"
            title="Toggle sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clean Portal / Menu Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm md:text-base font-semibold text-slate-500 min-w-0">
            <span className="hover:text-slate-700 transition-colors flex-shrink-0">
              {portalLabel}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-[var(--color-primary)] font-bold truncate">
              {title}
            </span>
          </div>
        </div>

        {/* ================= Right: Date, User & Logout ================= */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Formatted Live Date */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 max-w-[130px] truncate leading-tight">
                {full_name || "User"}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {role || "Staff"}
              </span>
            </div>
          </div>

          {/* Modern Logout Button */}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all duration-200 cursor-pointer shadow-2xs"
            title="Sign out of BitCare"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600 transition-colors" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ================= Modern Logout Modal ================= */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 ${
              animatingOut ? "opacity-0" : "opacity-100"
            }`}
            onClick={handleCancel}
          />

          <div
            className={`relative bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 w-full max-w-md transform transition-all duration-200 ${
              animatingOut
                ? "scale-95 opacity-0 -translate-y-2"
                : "scale-100 opacity-100 translate-y-0"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Confirm Logout
            </h2>

            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to end your current session? Please verify
              all patient entries or laboratory reports are saved.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/30 transition cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
