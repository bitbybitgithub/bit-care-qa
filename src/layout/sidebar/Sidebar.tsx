import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import Logo1 from "../../assets/BitCareLogo.png";
import Logo2 from "../../assets/BitCareLogo2.png";
import { getSessionItem } from "../../context/sessions/userSession";
import type { Role, SidebarProps } from "../../types/common/sidebarTypes";
import type { EntityType } from "../../context/constant/enum";
import { SIDEBAR_MENUS } from "../../context/constant/sidebarMenus";
const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const role = getSessionItem<Role>("user", "role");
  const entityType = getSessionItem<number>("user", "entity_type");

  const menuItems =
    role && entityType
      ? SIDEBAR_MENUS[entityType as EntityType]?.[role] ?? []
      : [];

  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const SidebarContent = (
    <div
      className={`relative flex flex-col h-full bg-[var(--color-primary)]
      transition-all duration-300
      ${isCollapsed ? "w-20" : "w-56"}`}
    >
      <div className="p-2 flex justify-center">
        {!isCollapsed ? (
          <img
            src={Logo1}
            alt="Logo"
            className="w-[80%] h-[70px] object-contain bg-white shadow-2xl rounded"
          />
        ) : (
          <img
            src={Logo2}
            alt="Logo"
            className="w-10 h-10 bg-white rounded-full p-1"
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="py-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.link);

            return (
              <li key={item.link} className="px-3">
                <NavLink
                  to={item.link}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md
                    text-sm font-medium transition
                    ${isCollapsed ? "justify-center" : ""}
                    ${
                      active
                        ? "bg-white text-[var(--color-primary)]"
                        : "text-white hover:bg-white hover:text-[var(--color-primary)]"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {!isCollapsed && <span>{item.title}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {isMobile && (
        <IconButton onClick={toggleMobileDrawer} className="m-2 text-white">
          <MenuIcon />
        </IconButton>
      )}

      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={toggleMobileDrawer}
          PaperProps={{
            style: {
              width: 290,
              background: "var(--color-primary)",
            },
          }}
        >
          {SidebarContent}
        </Drawer>
      ) : (
        SidebarContent
      )}
    </>
  );
};

export default Sidebar;
