import { FaSearch, FaUserPlus, FaTimes, FaUser } from "react-icons/fa";
import { useState, type JSX } from "react";
import AddUser from "../component/AddUser";
import { getSessionItem } from "../../context/sessions/userSession";
import { TfiAnnouncement } from "react-icons/tfi";
import SidebarBg from "../../assets/SidebarBg.png";
import LabQueues from "./LabQueues";
import { Module, Roles } from "../../context/constant/enum";
import LabWalkInVerificationModal from "./components/LabWalkInVerificationModal";
import LabWalkInRegisterForm from "./components/LabWalkInRegisterForm";
import type { Patient } from "../../types/patientType/patientTypeInterfaces";
export interface DashboardCard {
  id: number;
  title: string;
  key: string;
  count: number;
  icon?: JSX.Element;
}

const LabDashboard = () => {
  const user = getSessionItem("user", "role");
  const username = getSessionItem("user", "full_name");
  const module = Module.LAB;
  const [queueSearch, setQueueSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState("pendingQueue");
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInContact, setWalkInContact] = useState("");
  const [walkInPatient, setWalkInPatient] = useState<Patient | null>(null);
  const [showWalkInRegistration, setShowWalkInRegistration] = useState(false);
  const isLabStaff = user === Roles.Staff || user === Roles.Admin;

  const tabs = [
    { key: "pendingQueue", label: "Pending" },
    { key: "processingQueue", label: "Processing" },
    { key: "ReportingQueue", label: "Reporting" },
    { key: "CompletedQueue", label: "Completed" },
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
                 bg-[var(--color-bg)] text-[var(--color-text)] border-2 border-transparent shadow-[var(--shadow-md)]
                 px-2 py-2 rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-alt)] hover:border-2 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-lg)] transition cursor-pointer normal-case"
    >
      {icon} {label}
    </button>
  );

  const resetWalkInFlow = () => {
    setShowWalkInModal(false);
    setWalkInContact("");
    setWalkInPatient(null);
    setShowWalkInRegistration(false);
  };

  const quickActions = [
    {
      label: "Add New User",
      icon: <FaUserPlus />,
      onClick: () => setShowAddUser(true),
    },
  ];

  return (
    <div className="flex flex-col relative gap-4">
      <div
        className="
          relative 
          shadow-[var(--shadow-md)] 
          px-4 sm:px-6
          py-5 sm:py-7
          flex items-center justify-between 
          rounded-[var(--radius-lg)]
          overflow-hidden
          border border-[var(--color-border)]/40
        "
        style={{
          backgroundImage: `
            linear-gradient(to right, 
              rgba(255,255,255,1) 0%,
              rgba(255,255,255,0.9) 60%,
              rgba(255,255,255,0.4) 85%,
              rgba(255,255,255,0) 100%
            ),
            url(${SidebarBg})
          `,
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      >
        <div>
          <h1 className="text-[var(--color-text)] font-[var(--font-weight-bold)] text-lg sm:text-xl md:text-2xl">
            Welcome,{" "}
            <span className="text-[var(--color-primary)]">{username || "Lab Staff"}</span>
          </h1>

          <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-1">
            Your lab is running smoothly today. Check your daily stats and announcements below.
          </p>
        </div>
      </div>

      {user === Roles.Admin && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-[28%] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 flex flex-col justify-between">
            <h2 className="font-semibold text-sm sm:text-base mb-3 text-[var(--color-primary)] flex items-center gap-2">
              Quick Actions
            </h2>

            <div className="flex flex-col gap-2.5">
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

          <div className="w-full md:w-[72%] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] p-4 border border-[var(--color-border)] rounded-[var(--radius-lg)] flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2.5">
              <h2 className="font-semibold text-sm sm:text-base text-[var(--color-primary)] flex items-center gap-2">
                <TfiAnnouncement className="text-[var(--color-primary)]" />
                Lab Announcements
              </h2>
            </div>

            <div className="flex items-center gap-3 bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] rounded-[var(--radius-md)] border border-amber-200/80 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <TfiAnnouncement />
              </span>
              <p className="text-xs sm:text-sm text-[var(--color-text)] font-medium">
                The lab will be closed for the holiday on December 25th.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-surface-alt)] p-3 sm:p-5 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--color-border)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          {/* Responsive Segmented Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex p-1 gap-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] bg-[var(--color-primary)] shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => setActiveTab(t.key)}
                className={`
                  px-3 py-1.5 text-xs sm:text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition-all text-center
                  ${
                    activeTab === t.key
                      ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)] shadow-[var(--shadow-xs)]"
                      : "text-white/90 hover:bg-white/15"
                  }
                `}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {isLabStaff && activeTab === "pendingQueue" && (
              <button
                onClick={() => {
                  resetWalkInFlow();
                  setShowWalkInModal(true);
                }}
                className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:opacity-90 cursor-pointer shrink-0"
              >
                <FaUserPlus />
                <span>Add Walk-In Patient</span>
              </button>
            )}

            <div className="relative w-full sm:w-64 md:w-72">
              <FaSearch className="absolute left-3 top-2.5 text-[var(--color-primary)] text-sm pointer-events-none" />
              <input
                value={queueSearch}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                  setQueueSearch(value);
                }}
                placeholder="Search by Patient Name"
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-[var(--radius-md)] border border-[var(--color-primary)]/40 bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-text-secondary)]/60"
              />
              {queueSearch && (
                <button
                  onClick={() => setQueueSearch("")}
                  className="absolute right-2.5 top-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <LabQueues
            mode={
              activeTab === "processingQueue"
                ? "processing"
                : activeTab === "ReportingQueue"
                  ? "reporting"
                  : activeTab === "CompletedQueue"
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

      {showWalkInModal && (
        <LabWalkInVerificationModal
          open={showWalkInModal}
          onClose={() => {
            setShowWalkInModal(false);
            setWalkInContact("");
          }}
          onPatientSelect={(patient, contact) => {
            setShowWalkInModal(false);
            setWalkInContact(contact);
            setWalkInPatient(patient);
            setShowWalkInRegistration(true);
          }}
        />
      )}

      {showWalkInRegistration && (
        <LabWalkInRegisterForm
          contact={walkInContact}
          onClose={() => {
            setShowWalkInRegistration(false);
            setWalkInContact("");
          }}
          onSuccess={() => {
            setShowWalkInRegistration(false);
            setWalkInContact("");
            setWalkInPatient(null);
          }}
          patientData={walkInPatient}
        />
      )}
    </div>
  );
};

export default LabDashboard;
