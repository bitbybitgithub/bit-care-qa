import React, { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCog,
  FaHospital,
  FaClinicMedical,
} from "react-icons/fa";
import { FaTasks } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { TiMessages } from "react-icons/ti";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { GrSchedules } from "react-icons/gr";

interface MenuItem {
  icon: ReactNode;
  title: string;
  link: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation();

  // const Menus: MenuItem[] = [
  //   { title: "Dashboard", link: "/dashboard", icon: <FaHome /> },
  //   { title: "Users", link: "/users", icon: <FaUsers /> },
  //   { title: "Clinic App Settings", link: "/clinic-settings", icon: <FaCog /> },
  //   {
  //     title: "Clinic Operations",
  //     link: "/clinic-operations",
  //     icon: <FaHospital />,
  //   },
  // ];

  const Menus: MenuItem[] = [
    { title: "Dashboard", link: "/docdashboard", icon: <FaHome /> },
    { title: "Profile", link: "/profile", icon: <FaUsers /> },
    { title: "Manage availability", link: "/manage", icon: <FaCog /> },
  ];

  // const Menus: MenuItem[] = [
  //   { title: "Dashboard", link: "/staffdashboard", icon: <FaHome /> },
  //   { title: "Tasks & Reminder", link: "/taskandreminder", icon: <FaTasks /> },
  //   { title: "Assigned Patients", link: "/assignpatient", icon: <FaPeopleGroup /> },
  //   { title: "Internal Messaging", link: "/message", icon: <TiMessages  /> },
  //   { title: "Clinic Protocol", link: "/clnprotocol", icon: <HiOutlineDocumentReport /> },
  //   { title: "Shift Schedule", link: "/shiftschedule", icon: <GrSchedules /> },
  // ];

  return (
    <div className="h-full bg-blue-700 text-white rounded-r-3xl p-4 flex flex-col transition-all duration-300">
      {/* Logo */}
      <div className="mb-8 mt-2 flex items-center justify-center md:justify-start">
        {/* Icon on small screens */}
        <FaClinicMedical className="text-3xl md:hidden" />
        {/* Text on medium+ screens */}
        <span className="hidden md:inline text-2xl font-bold">Clinic Admin</span>
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
                    ? "bg-gray-100 text-blue-600 font-semibold shadow"
                    : "hover:bg-blue-200 hover:text-black"
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
