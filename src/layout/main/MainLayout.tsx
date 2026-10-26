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
  const labId = getSessionItem("user", "lab_id");
  const userId = getSessionItem("user", "user_id");
  const role = getSessionItem("user", "role");
  const pharmacyId = getSessionItem("user", "pharmacy_id");

  if (loading) return <Loader />;

  return (
    <div className="w-full h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* -------- Sidebar (Desktop Fixed) -------- */}
      <div
        className={`
          hidden md:block fixed top-0 left-0 h-full z-30
          bg-[var(--color-primary)]
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 z-50 bg-[var(--color-primary)] shadow-2xl transition-transform duration-300">
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
          flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out
          ${collapsed ? "md:ml-20" : "md:ml-64"} 
          ml-0
        `}
      >
        {/* -------- Header -------- */}
        <div className="sticky top-0 z-20">
          <Navbar
            onMenuClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(true);
              } else {
                setCollapsed((prev) => !prev);
              }
            }}
          />
        </div>

        {/* -------- Main Content (Scrollable) -------- */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 bg-[var(--color-bg)]">
          <SocketProvider
            token={token}
            clinicId={clinicId ? Number(clinicId) : null}
            doctorId={doctorId ? Number(doctorId) : null}
            labId={labId ? Number(labId) : null}
            userId={userId ? Number(userId) : null}
            role={role || null}
            pharmacyId={pharmacyId ? Number(pharmacyId) : null}
          >
            <Outlet />
          </SocketProvider>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
