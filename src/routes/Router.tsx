import { Navigate } from "react-router-dom";
import Login from "../features/Login/component/login";
import Dashboard from "../features/component/Dashboard";
import Registration from "../pages/RegistrationPage";
import MainLayout from "../layout/main/MainLayout";
import BlankLayout from "../layout/main/BlankLayout";
import Users from "../features/component/Users";
// import Profile from "../pages/Clinic/ProfilePage";
import DoctorProfile from "../features/component/DocProfile";
import DocDashboard from "../features/component/DocDashboard";
import ResetPasswordPage from "../components/common/ResetPasswordPage";
import Profile from "../features/clinic/components/Profile";
import Staffdashboard from "../features/component/StaffDashboard";

const Router = [
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      { path: "/", element: <Navigate to="/login" /> },
      { path: "/register", element: <Registration /> },
      { path: "/login", exact: true, element: <Login /> },
      { path: "/resetpassword", exact: true, element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/users", element: <Users /> },
      { path: "/clinic-settings", element: <Profile /> },

      { path: "/doc-dashboard", element: <DocDashboard /> },
      { path: "/patients-records", element: <DocDashboard /> },
      { path: "/add-diagnosis", element: <DocDashboard /> },
      { path: "/manage-medication", element: <DocDashboard /> },
      { path: "/refer-patient", element: <DocDashboard /> },
      { path: "/profile", element: <DoctorProfile /> },

      { path: "/staff-dashboard", element: <Staffdashboard /> },
      { path: "/task-and-reminder", element: <Staffdashboard /> },
      { path: "/assign-patient", element: <Staffdashboard /> },
      { path: "/message", element: <Staffdashboard /> },
      { path: "/cln-protocol", element: <Staffdashboard /> },
      { path: "/shift-schedule", element: <Staffdashboard /> },

      // { path: '/walkin-register', element: <WalkInRegisterForm /> },
      // { path: '/clinic-manage', element: <ManageAvailabilityPage/> }
    ],
  },
];

export default Router;
