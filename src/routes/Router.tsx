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
import ConsultationInProgress from "../features/appointment/consultation/in-progress/ConsultationInProgress";
import ComingSoon from "../components/common/ComingSoon";

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
      { path: "/clinic-dashboard", element: <Dashboard /> },
      { path: "/users", element: <Users /> },
      { path: "/clinic-settings", element: <Profile /> },
      { path: "/clinic-operations", element: <ComingSoon /> },

      { path: "/doctor-dashboard", element: <DocDashboard /> },
      { path: "/patients-records", element: <ComingSoon/> },
      { path: "/add-diagnosis", element: <ComingSoon/>},
      { path: "/manage-medication", element: <ComingSoon/>},
      { path: "/refer-patient", element: <ComingSoon/>},
      { path: "/profile", element: <DoctorProfile /> },

      { path: "/staff-dashboard", element: <Staffdashboard /> },
      { path: "/task-and-reminder", element: <ComingSoon/>},
      { path: "/assign-patient", element: <ComingSoon/>},
      { path: "/message", element: <ComingSoon/>},
      { path: "/cln-protocol", element: <ComingSoon/>},
      { path: "/shift-schedule", element: <ComingSoon/>},
      { path: "/consultation-in-progress", element: <ConsultationInProgress /> },

      // { path: '/walkin-register', element: <WalkInRegisterForm /> },
      // { path: '/clinic-manage', element: <ManageAvailabilityPage/> }
    ],
  },
];

export default Router;
