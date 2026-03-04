import {
  FaHome,
  FaUsers,
  FaCog,
} from "react-icons/fa";
import { GrDocumentText } from "react-icons/gr";
import { EntityType } from "./enum";
import type { MenuItem, Role } from "../../types/common/sidebarTypes";

export const SIDEBAR_MENUS: Record<
  EntityType,
  Partial<Record<Role, MenuItem[]>>
> = {
  [EntityType.Clinic]: {
    Admin: [
      { title: "Dashboard", link: "/clinic/dashboard", icon: FaHome },
      { title: "Users", link: "/clinic/users", icon: FaUsers },
      { title: "Doctor Empanelment", link: "/clinic/DoctorEmpanelment", icon: FaUsers },
      { title: "Lab Empanelment", link: "/clinic/labEmpanelment", icon: FaUsers },
      { title: "Pharma Empanelment", link: "/clinic/pharmaEmpanelment", icon: FaUsers },
      { title: "Clinic Settings", link: "/clinic/settings", icon: FaCog },
    ],
    Staff: [
      { title: "Staff Dashboard", link: "/staff/dashboard", icon: FaHome },
      {
        title: "Patient Document Management",
        link: "/patient-doc-managment",
        icon: GrDocumentText,
      },
    ],
    Doctor: [
      { title: "Doctor Dashboard", link: "/doctor/dashboard", icon: FaHome },
      { title: "Profile", link: "/doctor/profile", icon: FaUsers },
    ],
  },

  [EntityType.Lab]: {
    Admin: [
      { title: "Dashboard", link: "/lab/dashboard", icon: FaHome },
      { title: "Users", link: "/lab/users", icon: FaUsers },
      { title: "Lab Setting", link: "/lab/labsetting", icon: FaCog },
      // { title: "Service Management", link: "/lab/service-management", icon: FaCog },
    ],
    Staff: [
      { title: "Dashboard", link: "/lab/dashboard", icon: FaHome },
    ],
  },

  [EntityType.Pharmacy]: {
    Admin: [
      { title: "Dashboard", link: "/pharmacy/dashboard", icon: FaHome },
      { title: "Users", link: "/pharmacy/users", icon: FaUsers },
      { title: "Pharma Setting", link: "/pharmacy/pharmacysettings", icon: FaCog },
    ],
    Staff: [
      { title: "Dashboard", link: "/pharmacy/dashboard", icon: FaHome },
    ],
  },
};
