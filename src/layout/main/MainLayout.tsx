import { Outlet } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Navbar from "../navbar/Navbar";
import { useEffect, useState } from "react";

import Loader from "../../components/shared/Loader/Loader";
import { useLoader } from "../../context/LoaderContext";
import { SocketProvider } from "../../context/SocketContext";
import { TokenManager } from "../../api/auth/tokenManager";
import { getSession, getSessionItem } from "../../context/sessions/userSession";

const MainLayout = () => {
  const { loading } = useLoader();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const token = TokenManager.getAccessToken();

  // Redirect if no session
  useEffect(() => {
    const userSession = getSession("user");
    if (!userSession) window.location.href = "/login";
  }, [token]);

  const clinicId = getSessionItem("user", "clinic_id");
  const doctorId = getSessionItem("user", "doctor_id");

  if (loading) return <Loader />;

  return (
    <div className="w-full h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* -------- Sidebar (Desktop Fixed) -------- */}
      <div
        className={`
          hidden md:block fixed top-0 left-0 h-full 
          bg-[var(--color-primary)]
          transition-all duration-300 
          ${collapsed ? "w-20" : "w-56"}
        `}
      >
        <Sidebar
          isCollapsed={collapsed}
          setIsCollapsed={setCollapsed}
          mobileOpen={false}
          setMobileOpen={setMobileOpen}
        />
      </div>

      {/* -------- Sidebar (Mobile Drawer) -------- */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-[var(--color-primary)] z-50">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />
          </div>
        </div>
      )}

      {/* -------- Main Layout Wrapper -------- */}
      <div
        className={`
          flex flex-col h-full transition-all duration-300 w-auto
          ${collapsed ? "md:ml-20" : "md:ml-56"} 
          ml-0
        `}
      >
        {/* -------- Header -------- */}
        <div className="sticky top-0 z-40 shadow ">
          <Navbar
            onMenuClick={() => {
              if (window.innerWidth < 768) setMobileOpen(true);
              else setCollapsed((prev) => !prev);
            }}
          />
        </div>

        {/* -------- Main Content (Scrollable) -------- */}
        <div className="flex-1 overflow-y-auto p-7">
          <SocketProvider token={token} clinicId={clinicId} doctorId={doctorId}>
            <Outlet />
          </SocketProvider>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
