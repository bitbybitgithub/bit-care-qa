import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import Logo1 from "../../assets/BitCareLogo.png";
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

  const [role, setRole] = React.useState<Role | null>(null);
  const [entityType, setEntityType] = React.useState<EntityType | null>(null);
  const [entitylogo, setEntitylogo] = useState(Logo1);

  React.useEffect(() => {
    setRole(getSessionItem("user", "role"));
    setEntityType(getSessionItem("user", "entity_type"));
    const logo = getSessionItem("user", "entity_logo");

    if (logo) {
      setEntitylogo("data:image/png;base64," + logo);
    } else {
      setEntitylogo(Logo1);
    }
  }, []);
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
      <div className="p-2 bg-[var(--color-primary-dark)] flex justify-center items-center h-16 border-b-2 border-b-[var(--color-primary-dark)]">
        <img
          src={entitylogo}
          alt="Logo"
          className={`object-contain bg-white w-[90%] p-1 shadow-[var(--shadow-md)] rounded transition-all duration-300
      ${isCollapsed ? "h-14" : "h-14"}
    `}
        />
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
                    ${active
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
