import {  Navigate } from "react-router-dom";
import Login from "../features/Login/login";
import Dashboard from "../features/component/Dashboard";
import Registration from "../pages/RegistrationPage";
import MainLayout from "../layout/main/MainLayout";
import BlankLayout from "../layout/main/BlankLayout";
import Users from "../features/component/Users";
import Profile from "../pages/clinic/ProfilePage";


const Router = [
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/', element: <Navigate to="/login" /> },
      { path: '/register', element: <Registration /> },
      {path: '/login', exact: true, element: <Login /> },
    ]
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/users', element: <Users /> },
      { path: '/clinic-settings', element: <Profile /> },
    ]
  }

]

export default Router;
