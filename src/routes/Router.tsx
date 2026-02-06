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

import LabDashboard from "../features/component/LabDashboard";
import PharmacyDashboard from "../features/component/PharmacyDashboard";
import ServiceManagement from "../features/lab/ServiceManagement";
import LabProfile from "../features/lab/LabProfile";

const Router = [
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" /> },
      { path: "/register", element: <Registration /> },
      { path: "/login", exact: true, element: <Login /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // clinic admin routes
      { path: "/clinic/dashboard", element: <Dashboard /> },
      { path: "/clinic/users", element: <Users /> },
      { path: "/clinic/settings", element: <Profile /> },

      // clinic doctor routes
      { path: "/doctor/dashboard", element: <DocDashboard /> },
      { path: "/doctor/profile", element: <DoctorProfile /> },

      // clinic staff routes
      { path: "/staff/dashboard", element: <Staffdashboard /> },
      { path: "/patient-doc-managment", element: <PatientDocManagementPage /> },

      // lab routes
      { path: "/lab/dashboard", element: <LabDashboard /> },
      { path: "/lab/users", element: <Users /> },
      { path: "/lab/appsetting", element: <LabProfile /> },
      // { path: "/lab/service-management", element: <ServiceManagement /> },


      // pharmacy routes
      { path: "/pharmacy/users", element: <Users /> },
      { path: "/pharmacy/dashboard", element: <PharmacyDashboard /> },
      { path: "/pharmacy/settings", element: <Profile /> },

      // { path: "/patients-records", element: <ComingSoon /> },
      // { path: "/add-diagnosis", element: <ComingSoon /> },
      // { path: "/manage-medication", element: <ComingSoon /> },
      // { path: "/refer-patient", element: <ComingSoon /> },
      // { path: "/task-and-reminder", element: <ComingSoon /> },
      // { path: "/assign-patient", element: <ComingSoon /> },
      // { path: "/message", element: <ComingSoon /> },
      // { path: "/cln-protocol", element: <ComingSoon /> },
      // { path: "/shift-schedule", element: <ComingSoon /> },
      // {
      //   path: "/consultation-in-progress",
      //   element: <ConsultationInProgress />,
      // },
      // { path: '/walkin-register', element: <WalkInRegisterForm /> },
      // { path: '/clinic-manage', element: <ManageAvailabilityPage/> }
    ],
  },
];

export default Router;
