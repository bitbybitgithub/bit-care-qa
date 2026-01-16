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
import SidebarBg from "../../assets/SidebarBg.png";
import { fetchDashboardStats } from "../../api/DashboardApi";
import { useLoader } from "../../context/LoaderContext";
import { Module } from "../../Helper/Enums";
import PharmacyQueues from "./PharmacyQueues";
import { TextField } from "@mui/material";
export interface DashboardCard {
  id: number;
  title: string;
  key: string;
  count: number;
  icon?: JSX.Element;
}

const PharmacyDashboard = () => {
  const { loading, setLoading } = useLoader();
  useEffect(() => {
    setLoading(true);
  }, []);
  const userId = getSessionItem("user", "user_id");
  const module = Module.PHARMACY;
  const user =  getSessionItem("user", "role");
  const username = getSessionItem("user", "full_name");
  console.log(user)
  const [stats, setStats] = useState<DashboardCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [queueSearch, setQueueSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState("pendingQueue");
  const tabs = [
    { key: "pendingQueue", label: "Pending Queue" },
    { key: "completedQueue", label: "Completed Queue" },
  ];
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
  ];

  return (
    <div className="flex flex-col relative">
      <div
        className="
    h-[10vh] 
    relative 
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
            Welcome,{" "}
            <span className="text-[var(--color-primary)]">{username}</span>
          </h1>

          <p
            className="text-[var(--color-text)] opacity-70 -mt-1"
            style={{ fontSize: "var(--font-h5)" }}
          >
            Your pharmacy is running smoothly today.
            <br />
            <h3 className="opacity-60">
              Check your daily stats and announcements below.
            </h3>
          </p>
        </div>
      </div>

      {user === "Admin" && (
        <>
          <Cards items={stats} loading={loading} error={error} />

          <div className="md:flex gap-x-4">
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
          </div>
        </>
      )}
      <div className="bg-white p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] mt-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div
            className="flex p-1 space-x-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
            style={{ background: "var(--color-primary)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
                className={`
          px-2 py-1 text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition 
          ${
            activeTab === t.key
              ? "bg-white text-[var(--color-primary)]"
              : "text-white hover:bg-[var(--color-hover)]"
          }
        `}
              >
                {t.label}
              </button>
            ))}
          </div>

          <TextField
            size="small"
            placeholder="Search by Patient Name"
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <PharmacyQueues
            mode={
              activeTab === "processingQueue"
                ? "processing"
                : activeTab === "completedQueue"
                ? "completed"
                : "pending"
            }
            searchTerm={queueSearch}
          />
        </div>
      </div>

      {showAddUser && (
        <AddUser module={module} onClose={() => setShowAddUser(false)} />
      )}
    </div>
  );
};

export default PharmacyDashboard;
