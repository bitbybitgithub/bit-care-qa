import { useDispatch } from "react-redux";
import { FaClipboardList, FaIdCard, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchDashboardStats, type Stats } from "../../api/dashboardApi";
import AddUser from "./AddUser";
import Cards from "../../components/common/Cards";
import { useQuery } from "@tanstack/react-query";
import { getSessionItem } from "../../context/sessions/userSession";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clinicId = getSessionItem("user", "clinic_id");

  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalStaff: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  const { data } = useQuery<Stats>({
    queryKey: ["clinicProfile", clinicId],
    queryFn: () => fetchDashboardStats(Number(clinicId)),
    enabled: !!clinicId,
    staleTime: Infinity,
  });

  // ✅ Fix: re-run when data changes
  useEffect(() => {
    if (data) {
      setStats(data);
      setLoading(false);
    }
  }, [data]);

  const cardItems = [
    { title: "Total Appointments Today", value: stats.appointmentsToday },
    { title: "New Patients This Week", value: stats.newPatientsThisWeek },
    { title: "Doctors on Staff", value: stats.totalDoctors },
    { title: "Medical Staff", value: stats.totalStaff },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)] font-sans relative p-3 md:p-6 mt-4">
      {/* Common Cards Section */}
      <Cards items={cardItems} loading={loading} error={error} />

      {/* Quick Actions */}
      <div className="bg-[var(--color-bg)] shadow-md rounded-2xl p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-white)] px-4 py-3 rounded-2xl hover:opacity-80 transition cursor-pointer"
            onClick={() => setShowAddUser(true)}
          >
            <FaUserPlus className="text-lg" /> Add New User
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-white)] px-4 py-3 rounded-2xl hover:opacity-80 transition cursor-pointer">
            <FaClipboardList className="text-lg" /> View Audit Log
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-[var(--color-primary)] text-[var(--color-white)] px-4 py-3 rounded-2xl hover:opacity-80 transition cursor-pointer">
            <FaIdCard className="text-lg" /> View KYC Details
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-[var(--color-bg)] shadow-md rounded-2xl p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--color-text)]">
          Clinic Announcements
        </h2>
        <div className="bg-gray-200 border-l-4 border-[var(--color-primary)] rounded-xl p-4 text-gray-700">
          The clinic will be closed for the holiday on December 25th.
        </div>
      </div>

      {/* AddUser Modal */}
      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}

      <style>{`
        .loader {
          border-top-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
