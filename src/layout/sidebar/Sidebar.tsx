import React, { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaHospital,
  FaClinicMedical,
  FaTasks,
} from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { TiMessages } from "react-icons/ti";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { GrSchedules } from "react-icons/gr";
import { getSessionItem } from "../../context/sessions/userSession";
import { BiTimer } from "react-icons/bi";

interface MenuItem {
  icon: ReactNode;
  title: string;
  link: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const role = getSessionItem("user", "role");

  const ClinicMenus: MenuItem[] = [
    { title: "Clinic Dashboard", link: "/clinic-dashboard", icon: <FaHome /> },
    { title: "Users", link: "/users", icon: <FaUsers /> },
    { title: "Clinic App Settings", link: "/clinic-settings", icon: <FaCog /> },
    { title: "Clinic Operations", link: "/clinic-operations", icon: <FaHospital /> },
  ];

  const DoctorMenus: MenuItem[] = [
    { title: "Doctor Dashboard", link: "/doctor-dashboard", icon: <FaHome /> },
    { title: "Profile", link: "/profile", icon: <FaUsers /> },
    { title: "Patients Records", link: "/patients-records", icon: <FaUsers /> },
    { title: "Add Diagnosis Notes", link: "/add-diagnosis", icon: <FaUsers /> },
    { title: "Manage Medication", link: "/manage-medication", icon: <FaUsers /> },
    { title: "Refer Patient", link: "/refer-patient", icon: <FaUsers /> },
    {title: "Consultation in Progress", link: "/consultation-in-progress", icon: <BiTimer />},

  ];

  const StaffMenus: MenuItem[] = [
    { title: "Staff Dashboard", link: "/staff-dashboard", icon: <FaHome /> },
    { title: "Tasks & Reminder", link: "/task-and-reminder", icon: <FaTasks /> },
    { title: "Assigned Patients", link: "/assign-patient", icon: <FaPeopleGroup /> },
    { title: "Internal Messaging", link: "/message", icon: <TiMessages /> },
    { title: "Clinic Protocol", link: "/cln-protocol", icon: <HiOutlineDocumentReport /> },
    { title: "Shift Schedule", link: "/shift-schedule", icon: <GrSchedules /> },
  ];

  const menuMap = { Doctor: DoctorMenus, Staff: StaffMenus, Admin: ClinicMenus };
  const Menus: MenuItem[] = menuMap[role as keyof typeof menuMap] || [];

  return (
    <div className="h-full bg-[var(--color-primary)] text-[var(--color-white)] rounded-r-3xl p-4 flex flex-col transition-all duration-300">
      <div className="mb-8 mt-2 flex items-center justify-center md:justify-start">
        <FaClinicMedical className="text-3xl md:hidden" />
        <span className="hidden md:inline text-2xl font-bold">BitCare App</span>
      </div>

      <nav className="flex-1 space-y-3">
        {Menus.length === 0 ? (
          <div className="text-center text-white mt-10 text-sm opacity-70">
            Loading menu...
          </div>
        ) : (
          Menus.map((menu, index) => {
            const isActive = location.pathname === menu.link;
            return (
              <Link
                key={index}
                to={menu.link}
                className={`flex items-center justify-center md:justify-start gap-3 px-4 py-2 rounded-2xl font-medium transition-all duration-200 
                ${isActive
                    ? "bg-[var(--color-white)] text-[var(--color-primary)] font-semibold shadow"
                    : "hover:bg-[var(--color-white)] hover:text-[var(--color-primary)]"
                  }`}
              >
                <span className="text-lg">{menu.icon}</span>
                <span className="hidden md:inline">{menu.title}</span>
              </Link>
            );
          })
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
