import { FaUserPlus } from "react-icons/fa";
import { useState, type JSX } from "react";
import AddUser from "./AddUser";
import { getSessionItem } from "../../context/sessions/userSession";
import SidebarBg from "../../assets/SidebarBg.png";
import { Module } from "../../Helper/Enums";
import PharmacyQueues from "./PharmacyQueues";
import { TextField } from "@mui/material";
import { TfiAnnouncement } from "react-icons/tfi";
export interface DashboardCard {
  id: number;
  title: string;
  key: string;
  count: number;
  icon?: JSX.Element;
}

const PharmacyDashboard = () => {
  const module = Module.PHARMACY;
  const user = getSessionItem("user", "role");
  const username = getSessionItem("user", "full_name");
  const [queueSearch, setQueueSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState("pendingQueue");
  const tabs = [
    { key: "pendingQueue", label: "Pending" },
    { key: "completedQueue", label: "Completed" },
  ];
  
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
                 px-2 py-2  rounded-[var(--radius-lg)] hover:bg-[var(--color-white)] hover:border-2 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] transition cursor-pointer normal-case"
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
    mb-4
    shadow-[var(--shadow-lg)] 
    px-6
    flex items-center justify-between 
    py-12
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
            style={{ fontSize: "var(--font-h4)" }}
          >
            Welcome,{" "}
            <span className="text-[var(--color-primary)]">{username}</span>
          </h1>

          <p
            className="text-[var(--color-text)] opacity-70 "
            style={{ fontSize: "var(--font-body)" }}
          >
            Your pharmacy is running smoothly today.
            <h3 className="opacity-60">
              Check your daily stats and announcements below.
            </h3>
          </p>
        </div>
      </div>
      {user === "Admin" && (
        <>
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

            {/* Lab Announcements */}
            <div className="bg-[var(--color-bg)] shadow-[var(--shadow-md)] p-2 px-5 md:w-[75%] border-2 border-[var(--color-border)] rounded-[var(--radius-md)]">
              <div
                className="flex items-center gap-x-2 mb-2"
                style={{ fontSize: "var(--font-h4)" }}
              >
                <h2 className="font-[var(--font-weight-semibold)] text-[var(--color-primary)]">
                  Pharmacy Announcements
                </h2>
              </div>

              <div className="flex items-center gap-x-2 bg-[var(--color-white)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)] border-[var(--color-error)] p-2">
                <TfiAnnouncement
                  className="text-[var(--color-error)] "
                  style={{ fontSize: "var(--font-h4)" }}
                />
                <h1>
                  The pharmacy will be closed for the holiday on December 25th.
                </h1>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="bg-white p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] mt-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div
            className="flex p-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] gap-x-1"
            style={{ background: "var(--color-primary)" }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
                className={`
        flex-1 flex items-center justify-center
        px-2 py-1 text-sm font-semibold cursor-pointer
        rounded-[var(--radius-md)] transition
        border border-transparent
        
        w-[33%]
        ${
          activeTab === t.key
            ? "bg-[var(--color-white)] text-[var(--color-primary)] border-transparent"
            : "text-[var(--color-white)] hover:border-[var(--color-white)]"
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
            mode={activeTab === "pendingQueue" ? "pending" : "completed"}
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
