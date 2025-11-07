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
import { MdOutlineManageAccounts } from "react-icons/md";

interface MenuItem {
  icon: ReactNode;
  title: string;
  link: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();

  // ---------Clinic admin----------------
  // const Menus: MenuItem[] = [
  //   { title: "Dashboard", link: "/dashboard", icon: <FaHome /> },
  //   { title: "Users", link: "/users", icon: <FaUsers /> },
  //   { title: "Clinic App Settings", link: "/clinic-settings", icon: <FaCog /> },
  //   {title: "Clinic Operations",link: "/clinic-operations",icon: <FaHospital />,},
  // ];

  //----------- Doctor------------------
  // const Menus: MenuItem[] = [
  //   { title: "Dotor Dashboard", link: "/doc-dashboard", icon: <FaHome /> },
  //   { title: "Profile", link: "/profile", icon: <FaUsers /> },
  //   {
  //     title: "Manage availability",
  //     link: "/clinic-manage",
  //     icon: <MdOutlineManageAccounts />,
  //   },
  // ];

  // // -------------Staff--------------
  const Menus: MenuItem[] = [
    { title: "Staff Dashboard", link: "/staff-dashboard", icon: <FaHome /> },
    { title: "Tasks & Reminder", link: "/task-and-reminder", icon: <FaTasks /> },
    { title: "Assigned Patients", link: "/assign-patient", icon: <FaPeopleGroup /> },
    { title: "Internal Messaging", link: "/message", icon: <TiMessages  /> },
    { title: "Clinic Protocol", link: "/cln-protocol", icon: <HiOutlineDocumentReport /> },
    { title: "Shift Schedule", link: "/shift-schedule", icon: <GrSchedules /> },
  ];

  return (
    <div className="h-full bg-[var(--color-primary)] text-[var(--color-white)] rounded-r-3xl p-4 flex flex-col transition-all duration-300"
      // style={localStorage.getItem("theme") === "dark" ? { backgroundColor: "var(--color-bg)" } : {}}
      >
      {/* Logo */}
      <div className="mb-8 mt-2 flex items-center justify-center md:justify-start">
        {/* Icon on small screens */}
        <FaClinicMedical className="text-3xl md:hidden" />
        {/* Text on medium+ screens */}
        <span className="hidden md:inline text-2xl font-bold  ">
          BitCare App
        </span>
        {/* <span className="hidden md:inline text-2xl font-bold">Doctor </span> */}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-3">
        {Menus.map((menu, index) => {
          const isActive = location.pathname === menu.link;

          return (
            <Link
              key={index}
              to={menu.link}
              className={`
                flex items-center justify-center md:justify-start gap-3 px-4 py-2 rounded-2xl font-medium transition-all duration-200 
                ${
                  isActive
                    ? "bg-[var(--color-white)] dark:bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold shadow"
                    : "hover:bg-[var(--color-white)] hover:text-[var(--color-primary)] dark:hover:bg-[var(--color-surface)] "
                }
              `}
            >
              {/* Always show icon */}
              <span className="text-lg">{menu.icon}</span>
              {/* Hide title on small screens */}
              <span className="hidden md:inline">{menu.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
