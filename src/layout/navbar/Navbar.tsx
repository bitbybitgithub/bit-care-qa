import React, { useState, useRef, useEffect } from "react";
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
  ChevronDown,
  Calendar,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userrole = getSessionItem("user", "role");
  const entity_type = getSessionItem("user", "entity_type");
  const entity_name = getSessionItem("user", "entity_name");
  const full_name = getSessionItem("user", "full_name");
  const email = getSessionItem("user", "email");

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
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // If single word with PascalCase/CamelCase (e.g. TrueHeal -> TH)
    const capitals = clean.match(/[A-Z]/g);
    if (capitals && capitals.length >= 2) {
      return (capitals[0] + capitals[1]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const portalLabel = getPortalLabel(entity);

  // The primary display name of the establishment (e.g., "TrueHeal Clinic" or "Heal Lab")
  const displayName =
    full_name?.trim() ||
    (entity_name && entity_name.toLowerCase() !== portalLabel.toLowerCase()
      ? entity_name
      : "") ||
    portalLabel ||
    "User";
  const roleDisplayName = role || "Staff";
  const initials = getInitials(displayName, role);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  // Close menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Handle direct logout without popup modal
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const res = await logoutApi();

      if (res.success) {
        setIsMenuOpen(false);
        dispatch(logout());
        clearSession("user");
        navigate("/login");
      } else {
        toast.error(res.error || "Logout failed");
        setIsLoggingOut(false);
      }
    } catch {
      toast.error("Network error during logout");
      setIsLoggingOut(false);
    }
  };

  return (
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

      {/* ================= Right: Date & Entity Dropdown Menu ================= */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {/* Formatted Live Date */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Entity Menu Trigger & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            aria-label="User and entity menu"
            title={displayName}
            className={`group flex items-center gap-1.5 p-1 pr-2 rounded-xl border transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 ${
              isMenuOpen
                ? "bg-slate-100/90 border-slate-300 shadow-xs"
                : "bg-white/90 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 shadow-2xs"
            }`}
          >
            {/* Initials of the entity */}
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105">
              {initials}
            </div>

            {/* Down arrow icon */}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-transform duration-200 ${
                isMenuOpen ? "rotate-180 text-[var(--color-primary)]" : ""
              }`}
            />
          </button>

          {/* Modern Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-xs bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 origin-top-right focus:outline-none"
              >
                {/* Entity & User Profile Section */}
                <div className="p-3.5 sm:p-4 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-sm font-bold text-slate-900 truncate leading-snug"
                        title={displayName}
                      >
                        {displayName}
                      </span>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] capitalize">
                          <ShieldCheck className="w-3 h-3" />
                          {roleDisplayName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {portalLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {email && (
                    <div
                      className="mt-2.5 pt-2 border-t border-slate-100/90 text-[11px] text-slate-500 truncate"
                      title={email}
                    >
                      {email}
                    </div>
                  )}
                </div>

                {/* Menu Options Section */}
                <div className="p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50/80 active:bg-rose-100/70 transition-all duration-150 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-rose-100/70 text-slate-500 group-hover:text-rose-600 flex items-center justify-center transition-colors duration-150">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-rose-400 font-normal">
                          Sign out of session
                        </span>
                      </div>
                    </div>

                    {isLoggingOut ? (
                      <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </button>
                </div>

                {/* Footer Active Session Bar */}
                <div className="px-3.5 py-2 bg-slate-50/80 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>BitCare System</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Session
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
