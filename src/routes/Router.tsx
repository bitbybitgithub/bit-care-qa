import { Navigate } from "react-router-dom";
import Login from "../features/Login/component/login";
import Dashboard from "../features/component/Dashboard";
import Registration from "../pages/RegistrationPage";
import MainLayout from "../layout/main/MainLayout";
import BlankLayout from "../layout/main/BlankLayout";
import Users from "../features/component/Users";
import DoctorProfile from "../features/component/DocProfile";
import DocDashboard from "../features/component/DocDashboard";
import Profile from "../features/clinic/components/Profile";
import Staffdashboard from "../features/component/StaffDashboard";
// import ComingSoon from "../components/common/ComingSoon";
import PatientDocManagementPage from "../features/patient-document-management/pages/PatientDocManagementPage";

import LabDashboard from "../features/lab/LabDashboard";
import PharmacyDashboard from "../features/pharma/PharmacyDashboard";
import ServiceManagement from "../features/lab/ServiceManagement";
import LabProfile from "../features/lab/LabProfile";
import LabEmpanelment from "../features/lab/LabEmpanelment";
import PharmaEmpanelment from "../features/pharma/PharmaEmpanelment";
import PharmaSetting from "../features/pharma/PharmaSetting";
import DoctorEmpanelment from "../features/clinic/components/DoctorEmpanelment";
import SupportDashboard from "../features/internalusers/support/pages/SupportDashboard";
import Blogs from "../features/admin/Blogs";
import BlogsList from "../features/list-blogs/BlogsList";
import ClinicSettings from "../components/common/EstablishmentSettings/Clinicsettings";
import LabSettings from "../components/common/EstablishmentSettings/Labsettings";
import PharmacySettings from "../components/common/EstablishmentSettings/Pharmacysettings";
import BlogTabs from "../features/admin/BlogTabs";
import NotFoundPage from "../pages/NotFoundPage";
import OffersTabs from "../features/admin/OffersTabs";

const Router = [
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" /> },
      { path: "/register", element: <Registration /> },
      { path: "/login", exact: true, element: <Login /> },
      // Public / General View Routes (View Only - No Editing)
      { path: "/blog", element: <BlogsList /> },
      { path: "/bloglist", element: <BlogsList /> },
      { path: "/blogs", element: <BlogsList /> },
      { path: "/blog/:blogId", element: <BlogsList /> },
      { path: "/404", element: <NotFoundPage /> },

    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // clinic admin routes
      { path: "/clinic/dashboard", element: <Dashboard /> },
      { path: "/clinic/users", element: <Users /> },
      { path: "/clinic/DoctorEmpanelment", element: <DoctorEmpanelment /> },
      { path: "/clinic/labempanelment", element: <LabEmpanelment /> },
      { path: "/clinic/pharmaempanelment", element: <PharmaEmpanelment /> },
      { path: "/clinic/offers", element: <OffersTabs /> },
      { path: "/clinic/blog", element: <Navigate to="/clinic/BlogTabs" replace /> },
      { path: "/clinic/BlogTabs", element: <BlogTabs /> },
      {
        path: "/clinic/BlogTabs/blog/edit/:blogId",
        element: <Blogs />,
      },
      { path: "/clinic/blog/:blogId", element: <BlogsList /> },
      { path: "/clinic/bloglist", element: <BlogsList /> },
      { path: "/clinic/settings", element: <ClinicSettings /> },

      // clinic doctor routes
      { path: "/doctor/dashboard", element: <DocDashboard /> },
      { path: "/doctor/profile", element: <DoctorProfile /> },

      // clinic staff routes
      { path: "/staff/dashboard", element: <Staffdashboard /> },
      { path: "/patient-doc-managment", element: <PatientDocManagementPage /> },

      // lab routes
      { path: "/lab/dashboard", element: <LabDashboard /> },
      { path: "/lab/users", element: <Users /> },
      { path: "/lab/offers", element: <OffersTabs /> },
      { path: "/lab/labsetting", element: <LabSettings /> },
      { path: "/lab/service-management", element: <ServiceManagement /> },

      // pharmacy routes
      { path: "/pharmacy/users", element: <Users /> },
      { path: "/pharmacy/dashboard", element: <PharmacyDashboard /> },
      { path: "/pharmacy/pharmacysettings", element: <PharmacySettings /> },
      { path: "/pharmacy/settings", element: <PharmacySettings /> },
      { path: "/pharmacy/pharmasettings", element: <PharmacySettings /> },

      // SupportTeam routes
      { path: "/support/dashboard", element: <SupportDashboard /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default Router;
