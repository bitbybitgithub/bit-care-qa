import {
  FaHome,
  FaUsers,
  FaCog,
  FaClinicMedical,
  FaUserMd,
  FaGift,
  FaVials,
} from "react-icons/fa";
import { EntityType } from "./enum";
import type { MenuItem, Role } from "../../types/common/sidebarTypes";
import ScienceIcon from "@mui/icons-material/Science";

export const SIDEBAR_MENUS: Record<
  EntityType,
  Partial<Record<Role, MenuItem[]>>
> = {
  [EntityType.Clinic]: {
    Admin: [
      { title: "Dashboard", link: "/clinic/dashboard", icon: FaHome },
      { title: "Users", link: "/clinic/users", icon: FaUsers },
      {
        title: "Doctor Empanelment",
        link: "/clinic/DoctorEmpanelment",
        icon: FaUserMd,
      },
      {
        title: "Lab Empanelment",
        link: "/clinic/labEmpanelment",
        icon: ScienceIcon,
      },
      {
        title: "Pharmacy Empanelment",
        link: "/clinic/pharmaEmpanelment",
        icon: FaClinicMedical,
      },
       { title: "Offers", link: "/clinic/offers", icon: FaGift },
      
      { title: "Blogs", link: "/clinic/BlogTabs", icon: FaGift },
      
      { title: "Settings", link: "/clinic/settings", icon: FaCog },
    ],
    Staff: [
      { title: "Staff Dashboard", link: "/staff/dashboard", icon: FaHome },
     
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
      { title: "Offers", link: "/lab/offers", icon: FaGift },
      {
        title: "Service Management",
        link: "/lab/service-management",
        icon: FaVials,
      },
      { title: "Setting", link: "/lab/labsetting", icon: FaCog },
    ],
    Staff: [{ title: "Dashboard", link: "/lab/dashboard", icon: FaHome }],
  },

  [EntityType.Pharmacy]: {
    Admin: [
      { title: "Dashboard", link: "/pharmacy/dashboard", icon: FaHome },
      { title: "Users", link: "/pharmacy/users", icon: FaUsers },
      {
        title: "Pharma Setting",
        link: "/pharmacy/pharmacysettings",
        icon: FaCog,
      },
    ],
    Staff: [{ title: "Dashboard", link: "/pharmacy/dashboard", icon: FaHome }],
  },
  [EntityType.Doctor]: {
    Doctor: [
      { title: "Doctor Dashboard", link: "/doctor/dashboard", icon: FaHome },
      { title: "Profile", link: "/doctor/profile", icon: FaUsers },
    ],
  },
  [EntityType.Support]: {
    support: [
      { title: "Support Dashboard", link: "/support/dashboard", icon: FaHome },
    ],
  },
};
