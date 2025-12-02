import { useDispatch } from "react-redux";
import { FaClipboardList, FaIdCard, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AddUser from "./AddUser";
import Cards from "../../components/common/Cards";
import { useQuery } from "@tanstack/react-query";
import { getSessionItem } from "../../context/sessions/userSession";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaCalendarDays } from "react-icons/fa6";
import { FaUserNurse } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";

import { TfiAnnouncement } from "react-icons/tfi";
import SidebarBg from "../../assets/SidebarBg.png";
import { fetchDashboardStats } from "../../api/DashboardApi";
export interface DashboardCard {
  id: number;
  title: string;
  key: string;
  count: number;
  icon?: JSX.Element;
}

const Dashboard = () => {
  const userId = getSessionItem("user", "user_id");

  const [stats, setStats] = useState<DashboardCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  const { data } = useQuery<DashboardCard[]>({
    queryKey: ["dashboardStats", userId],
    queryFn: () => fetchDashboardStats(Number(userId)),
    enabled: !!userId,
    staleTime: Infinity,
  });

  // -------------------------
  // ICON MAP
  // -------------------------
  const cardIcon: Record<number, JSX.Element> = {
    1: <FaCalendarDays className="text-amber-600" />,
    2: <FaPeopleGroup className="text-blue-600" />,
    3: <FaUserDoctor className="text-emerald-600" />,
    4: <FaUserNurse className="text-violet-600" />,
  };

  // -------------------------
  // MAP DATA + ICONS
  // -------------------------
  useEffect(() => {
    if (data) {
      const mapped = data.map((item) => ({
        ...item,
        icon: cardIcon[item.card_id] ?? null,
      }));

      setStats(mapped);
      setLoading(false);
    }
  }, [data]);

  // Reusable button
  const ActionButton = ({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-auto gap-x-2
                 bg-[var(--color-surface)] text-[var(--color-text)] border-2 border-transparent shadow-[var(--shadow-md)]
                 px-4 py-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-white)] hover:border-2 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] transition cursor-pointer normal-case"
    >
      {icon} {label}
    </button>
  );

  const quickActions = [
    {
      label: "Add New User",
      icon: <FaUserPlus />,
      onClick: () => setShowAddUser(true),
    },
    {
      label: "View Audit Log",
      icon: <FaClipboardList className="text-lg" />,
    },
    {
      label: "View KYC Details",
      icon: <FaIdCard className="text-lg" />,
    },
  ];

  return (
    <div className="flex flex-col relative">
      {/* ⭐ Welcome Banner */}
      <div
        className="
    h-[10vh] 
    relative 
    mb-5 
    shadow-[var(--shadow-lg)] 
    px-6
    flex items-center justify-between 
    py-14 
    rounded-[var(--radius-md)]
    overflow-hidden
  "
        style={{
          backgroundImage: `
      linear-gradient(to right, 
        rgba(255,255,255,1) 0%,
        rgba(255,255,255,0.85) 70%,
        rgba(255,255,255,0.3) 80%,
        rgba(255,255,255,0) 100%
      ),
      url(${SidebarBg})
    `,
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      >
        <div>
          <h1
            className="text-[var(--color-text)] font-[var(--font-weight-bold)]"
            style={{ fontSize: "var(--font-h2)" }}
          >
            Welcome, <span className="text-[var(--color-primary)]">Admin</span>
          </h1>

          <p
            className="text-[var(--color-text)] opacity-70 -mt-1"
            style={{ fontSize: "var(--font-h5)" }}
          >
            Your clinic is running smoothly today.
            <br />
            <h3 className="opacity-60">
              Check your daily stats and announcements below.
            </h3>
          </p>
        </div>
      </div>

      {/* ⭐ Stats Cards */}

      <Cards items={stats} loading={loading} error={error} />

      {/* ⭐ Quick Actions + Announcements */}
      <div className="md:flex gap-x-4">
        {/* Quick Actions */}
        <div className="md:w-[30%] bg-[var(--color-bg)] shadow-[var(--shadow-md)] border-2 border-[var(--color-border)] rounded-[var(--radius-md)] p-4 md:p-6 mb-6 md:mb-0">
          <h2
            className="font-semibold mb-4 text-[var(--color-primary)]"
            style={{ fontSize: "var(--font-h3)" }}
          >
            Quick Actions
          </h2>

          <div className="flex flex-col flex-wrap gap-4">
            {quickActions.map((btn, i) => (
              <ActionButton
                key={i}
                icon={btn.icon}
                label={btn.label}
                onClick={btn.onClick}
              />
            ))}
          </div>
        </div>

        {/* Clinic Announcements */}
        <div className="bg-[var(--color-bg)] shadow-[var(--shadow-md)] p-4 md:p-6 md:w-[70%] border-2 border-[var(--color-border)] rounded-[var(--radius-md)]">
          <div
            className="flex items-center gap-x-2 mb-4"
            style={{ fontSize: "var(--font-h3)" }}
          >
            <h2 className="font-[var(--font-weight-semibold)] text-[var(--color-primary)]">
              Clinic Announcements
            </h2>
          </div>

          <div className="flex items-center gap-x-2 bg-[var(--color-white)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)] border-[var(--color-error)] p-4">
            <TfiAnnouncement
              className="text-[var(--color-error)] "
              style={{ fontSize: "var(--font-h3)" }}
            />
            <h1>The clinic will be closed for the holiday on December 25th.</h1>
          </div>
        </div>
      </div>

      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}
    </div>
  );
};

export default Dashboard;
