import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, Popover } from "@mui/material";
import Logo1 from "../../assets/BitCareLogo.png";
import { getSessionItem } from "../../context/sessions/userSession";
import type { Role, SidebarProps } from "../../types/common/sidebarTypes";
import { EntityType } from "../../context/constant/enum";
import { SIDEBAR_MENUS } from "../../context/constant/sidebarMenus";
import {
  useAppTheme,
  FONT_FAMILIES,
  FONT_SIZES,
  type ThemeMode,
} from "../../theme/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  ShieldCheck,
  Palette,
  Check,
  Type,
  SlidersHorizontal,
} from "lucide-react";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  description: string;
  swatchClass: string;
  accentClass: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();
  const { mode, setMode, font, setFont, fontSize, setFontSize } = useAppTheme();
  const [activeThemeTab, setActiveThemeTab] = useState<"theme" | "font" | "scale">("theme");

  const [role, setRole] = useState<Role | null>(null);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [entityName, setEntityName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [entitylogo, setEntitylogo] = useState<string>(Logo1);
  const [themeAnchorEl, setThemeAnchorEl] = useState<HTMLElement | null>(null);

  const handleThemeToggle = (event: React.MouseEvent<HTMLElement>) => {
    setThemeAnchorEl((prev) => (prev ? null : event.currentTarget));
  };

  const handleThemeClose = () => {
    setThemeAnchorEl(null);
  };

  const openTheme = Boolean(themeAnchorEl);

  useEffect(() => {
    const userRole = getSessionItem("user", "role");
    const userEntityType = getSessionItem("user", "entity_type");
    const userEntityName = getSessionItem("user", "entity_name");
    const userFullName = getSessionItem("user", "full_name");
    const logo = getSessionItem("user", "entity_logo");

    setRole(userRole);
    setEntityType(userEntityType);
    setEntityName(userEntityName || "");
    setFullName(userFullName || "");

    if (logo) {
      setEntitylogo(
        logo.startsWith("data:") ? logo : "data:image/png;base64," + logo
      );
    } else {
      setEntitylogo(Logo1);
    }
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsCollapsed]);

  const menuItems =
    role && entityType
      ? SIDEBAR_MENUS[entityType as EntityType]?.[role] ?? []
      : [];

  const isItemActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path + "/"));

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

  const portalLabel = getPortalLabel(entityType);
  const initials = getInitials(fullName, role);

  const themeOptions: ThemeOption[] = [
    {
      id: "ocean",
      name: "Ocean Cyan",
      description: "Default healthcare blue",
      swatchClass: "bg-sky-500",
      accentClass: "bg-sky-200",
    },
    {
      id: "green",
      name: "Medical Green",
      description: "Clinical mint emerald",
      swatchClass: "bg-emerald-600",
      accentClass: "bg-emerald-200",
    },
    {
      id: "light",
      name: "Royal Navy",
      description: "Classic medical indigo",
      swatchClass: "bg-blue-600",
      accentClass: "bg-blue-200",
    },
    {
      id: "violet",
      name: "Linear Violet",
      description: "Modern purple workspace",
      swatchClass: "bg-violet-600",
      accentClass: "bg-violet-200",
    },
    {
      id: "sunset",
      name: "Stripe Sunset",
      description: "Vibrant warm coral",
      swatchClass: "bg-orange-600",
      accentClass: "bg-orange-200",
    },
    {
      id: "teal",
      name: "BioTech Teal",
      description: "Supabase mint cyan",
      swatchClass: "bg-teal-600",
      accentClass: "bg-teal-200",
    },
    {
      id: "slate",
      name: "Vercel Slate",
      description: "Minimalist zinc monochrome",
      swatchClass: "bg-slate-800",
      accentClass: "bg-slate-300",
    },
  ];

  const ThemePickerContent = (
    <div className="w-72 bg-white text-slate-800 p-3 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          Appearance & Style
        </span>
        <button
          type="button"
          onClick={handleThemeClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="flex rounded-lg bg-slate-100 p-0.5 mb-2.5">
        <button
          type="button"
          onClick={() => setActiveThemeTab("theme")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
            activeThemeTab === "theme"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Palette className="w-3 h-3 text-[var(--color-primary)]" />
          Theme
        </button>
        <button
          type="button"
          onClick={() => setActiveThemeTab("font")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
            activeThemeTab === "font"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Type className="w-3 h-3 text-[var(--color-primary)]" />
          Font
        </button>
        <button
          type="button"
          onClick={() => setActiveThemeTab("scale")}
          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
            activeThemeTab === "scale"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3 text-[var(--color-primary)]" />
          Scale
        </button>
      </div>

      {/* Tab: Theme */}
      {activeThemeTab === "theme" && (
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {themeOptions.map((t) => {
            const isSelected = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-100 ring-1 ring-slate-300 font-semibold"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-center flex-shrink-0 ${t.swatchClass}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${t.accentClass}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-800 font-semibold leading-tight">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.description}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Font Family */}
      {activeThemeTab === "font" && (
        <div className="space-y-1">
          {FONT_FAMILIES.map((f) => {
            const isSelected = font === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFont(f.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-100 ring-1 ring-slate-300 font-semibold"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex flex-col">
                  <span
                    className="text-xs text-slate-800 font-medium leading-tight"
                    style={{ fontFamily: f.value }}
                  >
                    {f.name}
                  </span>
                  <span
                    className="text-[10px] text-slate-400 mt-0.5"
                    style={{ fontFamily: f.value }}
                  >
                    Aa Bb Gg 1 2 3
                  </span>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Density / Scale */}
      {activeThemeTab === "scale" && (
        <div className="space-y-1">
          {FONT_SIZES.map((s) => {
            const isSelected = fontSize === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setFontSize(s.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-100 ring-1 ring-slate-300 font-semibold"
                    : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-800 font-semibold leading-tight">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-200/70">
                      {s.scale}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {s.id === "compact" && "High data density for clinical tables"}
                    {s.id === "normal" && "Default standard interface sizing"}
                    {s.id === "spacious" && "Larger readable text and relaxed view"}
                  </span>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`
        relative flex flex-col h-full 
        bg-[var(--color-primary)]
        border-r border-[var(--color-primary-dark)]/30
        text-white
        transition-all duration-300 ease-in-out select-none
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      {/* ================= Brand Header ================= */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-white/15 flex-shrink-0">
        <div
          className={`flex items-center min-w-0 w-full ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {/* Logo Frame - Native transparent display without white background box */}
          {isCollapsed ? (
            <Tooltip
              title={`${entityName || portalLabel}`}
              placement="right"
              arrow
            >
              <div className="w-full flex items-center justify-center cursor-pointer py-2">
                {entitylogo ? (
                  <img
                    src={entitylogo}
                    alt={entityName || "Logo"}
                    className="max-h-12 max-w-[48px] object-contain drop-shadow-xs"
                  />
                ) : (
                  <Activity className="w-7 h-7 text-white" />
                )}
              </div>
            </Tooltip>
          ) : (
            <div className="w-full flex items-center justify-center py-2">
              {entitylogo ? (
                <img
                  src={entitylogo}
                  alt={entityName || "Logo"}
                  className="max-h-14 w-auto max-w-full object-contain drop-shadow-xs"
                />
              ) : (
                <div className="flex items-center gap-2.5 text-white font-bold text-base">
                  <Activity className="w-6 h-6 text-white" />
                  <span className="truncate">{entityName || "BitCare"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer ml-2 flex-shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ================= Navigation Menu ================= */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
            Menu
          </div>
        )}

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.link);

            const content = (
              <NavLink
                to={item.link}
                onClick={() => setMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-200
                  ${isCollapsed ? "justify-center px-0 py-2.5" : ""}
                  ${
                    active
                      ? "bg-white text-[var(--color-primary)] font-semibold shadow-md"
                      : "text-white/85 hover:text-white hover:bg-white/15"
                  }
                `}
              >
                <span
                  className={`
                    flex items-center justify-center transition-colors
                    ${
                      active
                        ? "text-[var(--color-primary)]"
                        : "text-white/80 group-hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </span>

                {!isCollapsed && (
                  <span className="truncate tracking-tight">{item.title}</span>
                )}

                {/* Subtle active glow indicator */}
                {active && !isCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                )}
              </NavLink>
            );

            return (
              <li key={item.link}>
                {isCollapsed ? (
                  <Tooltip title={item.title} placement="right" arrow>
                    {content}
                  </Tooltip>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ================= Footer Section ================= */}
      <div className="p-3 border-t border-white/15 space-y-2 flex-shrink-0 bg-[var(--color-primary)]">
        {/* Collapse / Expand Toggle Button (Desktop Only) */}
        <div className="hidden md:block">
          {isCollapsed ? (
            <Tooltip title="Expand Sidebar (Ctrl+B)" placement="right" arrow>
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-full flex items-center justify-center p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/85 hover:text-white hover:bg-white/15 transition cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <span className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-white/70" />
                <span>Collapse</span>
              </span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/15 text-white/80 border border-white/20">
                Ctrl+B
              </kbd>
            </button>
          )}
        </div>

        {/* User Card + Theme Option (Yellow Circle Section) */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip
              title={`${fullName || "User"} (${role || "Staff"})`}
              placement="right"
              arrow
            >
              <div className="flex items-center justify-center cursor-pointer py-1">
                <div className="w-9 h-9 rounded-xl bg-white text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shadow-xs">
                  {initials}
                </div>
              </div>
            </Tooltip>

            {/* Theme Trigger in Collapsed Mode */}
            <div>
              <Tooltip title={`Theme: ${mode}`} placement="right" arrow>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer flex items-center justify-center shadow-xs"
                  aria-label="Select Theme"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* User Details Pill */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white text-[var(--color-primary)] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate leading-tight">
                  {fullName || "Healthcare User"}
                </span>
                <span className="text-[10px] text-white/75 capitalize truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-white/90" />
                  {role || "Staff"}
                </span>
              </div>
            </div>

            {/* Modern Theme Option Button (Exact Yellow Circle Marked Location) */}
            <div>
              <Tooltip title="Theme Palette" placement="top" arrow>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer flex items-center justify-center shadow-xs"
                  aria-label="Select Theme"
                >
                  <Palette className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Viewport-Safe Theme Popover */}
      <Popover
        open={openTheme}
        anchorEl={themeAnchorEl}
        onClose={handleThemeClose}
        marginThreshold={16}
        anchorOrigin={{
          vertical: "top",
          horizontal: isCollapsed ? "right" : "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              overflow: "hidden",
            },
          },
        }}
      >
        {ThemePickerContent}
      </Popover>
    </aside>
  );
};

export default Sidebar;
