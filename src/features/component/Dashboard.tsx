import { FaUserPlus } from "react-icons/fa";
import { useState, useEffect, type JSX } from "react";
import AddUser from "./AddUser";
import Cards from "../../components/common/Cards";
import { useQuery } from "@tanstack/react-query";
import { getSessionItem } from "../../context/sessions/userSession";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaCalendarDays } from "react-icons/fa6";
import { FaUserNurse } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { TfiAnnouncement } from "react-icons/tfi";
import { fetchDashboardStats } from "../../api/DashboardApi";
import { useLoader } from "../../context/LoaderContext";
import WelcomeBanner from "../../components/common/WelcomeBanner";
import { Module } from "../../context/constant/enum";
export interface DashboardCard {
  id: number;
  title: string;
  key: string;
  count: number;
  icon?: JSX.Element;
}

const Dashboard = () => {
  const { loading, setLoading } = useLoader();
  useEffect(() => {
    setLoading(true);
  }, []);
  const userId = getSessionItem("user", "user_id");
  const module = Module.CLINIC;

  const [stats, setStats] = useState<DashboardCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const { data, isFetched } = useQuery<DashboardCard[]>({
    queryKey: ["dashboardStats", userId],
    queryFn: () => fetchDashboardStats(Number(userId)),
    enabled: !!userId,
    staleTime: Infinity,
  });

  const cardIcon: Record<number, JSX.Element> = {
    1: <FaCalendarDays className="text-amber-600" />,
    2: <FaPeopleGroup className="text-blue-600" />,
    3: <FaUserDoctor className="text-emerald-600" />,
    4: <FaUserNurse className="text-violet-600" />,
  };

  useEffect(() => {
    if (data && isFetched) {
      const mapped = data
        .map((item) => ({
          ...item,
          icon: cardIcon[item.card_id] ?? null,
        }))
        .sort((a, b) => a.card_id - b.card_id);

      setStats(mapped);
      setLoading(false);
    }
  }, [data]);

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
                 px-2 py-2  rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-alt)] hover:border-2 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] transition cursor-pointer normal-case"
    >
      {icon} {label}
    </button>
  );

  const quickActions = [
    {
      label: "Add New User",
      icon: <FaUserPlus />,
      onClick: () => setShowAddUser(true),
    }
  ];

  return (
    <div className="flex flex-col relative">

      <WelcomeBanner />
      <Cards items={stats} loading={loading} error={error} />

      <div className="md:flex gap-x-4 ">
        <div className="md:w-[25%] bg-[var(--color-bg)] shadow-[var(--shadow-md)] border-2 border-[var(--color-border)] rounded-[var(--radius-md)] p-2  px-5 mb-2 md:mb-0">
          <h2
            className="font-semibold mb-4 text-[var(--color-primary)]"
            style={{ fontSize: "var(--font-h4)" }}
          >
            Quick Actions
          </h2>

          <div className="flex flex-col flex-wrap gap-3">
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

        <div className="bg-[var(--color-bg)] shadow-[var(--shadow-md)] p-2 px-5 md:w-[75%] border-2 border-[var(--color-border)] rounded-[var(--radius-md)]">
          <div
            className="flex items-center gap-x-2 mb-2"
            style={{ fontSize: "var(--font-h4)" }}
          >
            <h2 className="font-[var(--font-weight-semibold)] text-[var(--color-primary)]">
              Clinic Announcements
            </h2>
          </div>

          <div className="flex items-center gap-x-2 bg-[var(--color-surface-alt)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)] border-[var(--color-error)] p-2">
            <TfiAnnouncement
              className="text-[var(--color-error)] "
              style={{ fontSize: "var(--font-h4)" }}
            />
            <h1>
              The clinic will be closed for the holiday on December 25th.
            </h1>
          </div>
        </div>
      </div>

      {showAddUser && <AddUser module={module} onClose={() => setShowAddUser(false)} />}
    </div>
  );
};

export default Dashboard;
