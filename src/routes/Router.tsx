import {  Navigate } from "react-router-dom";
import Login from "../features/Login/login";
import Dashboard from "../features/component/Dashboard";
import Registration from "../pages/RegistrationPage";
import MainLayout from "../layout/main/MainLayout";
import BlankLayout from "../layout/main/BlankLayout";


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
    ]
  }

]

export default Router;
