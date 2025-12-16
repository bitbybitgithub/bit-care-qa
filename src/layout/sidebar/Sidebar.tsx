import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import { Close, Menu as MenuIcon } from "@mui/icons-material";

import { FaHome, FaUsers, FaHospital, FaCog, FaTasks } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { TiMessages } from "react-icons/ti";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { GrDocumentText, GrSchedules } from "react-icons/gr";
import { BiTimer } from "react-icons/bi";
import Logo1 from "../../assets/BitCareLogo.png";
import Logo2 from "../../assets/BitCareLogo2.png";
import SidebarBg from "../../assets/SidebarBg.png";

import { getSessionItem } from "../../context/sessions/userSession";
import { DockIcon } from "lucide-react";

interface MenuItem {
  title: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// --------------------------------------------------
const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const location = useLocation();
  const role = getSessionItem("user", "role");

  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  // ---------------- Menus ----------------
  const ClinicMenus: MenuItem[] = [
    { title: "Clinic Dashboard", link: "/clinic-dashboard", icon: FaHome },
    { title: "Users", link: "/users", icon: FaUsers },
    { title: "Clinic App Settings", link: "/clinic-settings", icon: FaCog },
    // {
    //   title: "Clinic Operations",
    //   link: "/clinic-operations",
    //   icon: FaHospital,
    // },
  ];

  const DoctorMenus: MenuItem[] = [
    { title: "Doctor Dashboard", link: "/doctor-dashboard", icon: FaHome },
    { title: "Profile", link: "/profile", icon: FaUsers },
    { title: "Patients Records", link: "/patients-records", icon: FaUsers },
    { title: "Add Diagnosis Notes", link: "/add-diagnosis", icon: FaUsers },
    { title: "Manage Medication", link: "/manage-medication", icon: FaUsers },
    { title: "Refer Patient", link: "/refer-patient", icon: FaUsers },
    {
      title: "Consultation in Progress",
      link: "/consultation-in-progress",
      icon: BiTimer,
    },
  ];

  const StaffMenus: MenuItem[] = [
    { title: "Staff Dashboard", link: "/staff-dashboard", icon: FaHome },
    {
      title: "Patient Document Management",
      link: "/patient-doc-managment",
      icon: GrDocumentText,
    },
    // { title: "Tasks & Reminder", link: "/task-and-reminder", icon: FaTasks },
    // {
    //   title: "Assigned Patients",
    //   link: "/assign-patient",
    //   icon: FaPeopleGroup,
    // },
    // { title: "Internal Messaging", link: "/message", icon: TiMessages },
    // {
    //   title: "Clinic Protocol",
    //   link: "/cln-protocol",
    //   icon: HiOutlineDocumentReport,
    // },
    // { title: "Shift Schedule", link: "/shift-schedule", icon: GrSchedules },
  ];

  const menuMap = {
    Admin: ClinicMenus,
    Doctor: DoctorMenus,
    Staff: StaffMenus,
  };

  const menuItems = menuMap[role] || [];

  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // ----------------------------------------------
  const SidebarContent = (
    <div
      className={`relative flex flex-col h-full bg-[var(--color-primary)] transition-all duration-300
  ${isCollapsed ? "w-20" : "w-56"} overflow-hidden`}
    >
      {/* Blurred background image */}
      {/* <div
    className="absolute inset-1 bg-cover bg-no-repeat opacity-20"
    style={{ backgroundImage: `url(${SidebarBg})` }}
  ></div> */}

      {/* Sidebar content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="p-2 flex items-center justify-center w-full">
          {!isCollapsed ? (
            <img
              src={Logo1}
              alt="Menu"
              className="w-[80%] h-[70px] object-contain bg-[var(--color-white)] shadow-2xl border-y-2 border-black rounded-[var(--radius-none)]"
            />
          ) : (
            <div className="flex items-center justify-center">
              <img
                src={Logo2}
                alt="Menu"
                className="w-full h-auto bg-white rounded-[var(--radius-full)] p-1"
              />
            </div>
          )}
        </div>

        {/* Menu List */}
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition 
                  ${isCollapsed ? "justify-center" : ""}
                  ${
                    active
                      ? "bg-white text-[var(--color-primary)]"
                      : "text-white hover:bg-[var(--color-white)] hover:text-[var(--color-primary)]"
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
            style: { width: 290, background: "var(--color-primary)" },
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
