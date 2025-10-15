import {  Navigate } from "react-router-dom";
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
import ManageAvailabilityPage from "../features/clinic/components/ManageAvalibility";


const Router = [
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/', element: <Navigate to="/login" /> },
      { path: '/register', element: <Registration /> },
      {path: '/login', exact: true, element: <Login /> },
      {path: '/resetpassword', exact: true, element: <ResetPasswordPage /> },
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/users', element: <Users /> },
      { path: '/clinic-settings', element: <Profile /> },
      { path: '/profile', element: <DoctorProfile /> },
      { path: '/docdashboard', element: <DocDashboard /> },
      {path:'/clinic-manage', element:<ManageAvailabilityPage/>}

    ]
  }

]

export default Router;
