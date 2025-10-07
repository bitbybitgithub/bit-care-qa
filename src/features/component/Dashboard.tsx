import { useDispatch } from "react-redux";
import { FaClipboardList, FaIdCard, FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchDashboardStats } from "../../api/dashboardApi";
import AddUser from "./AddUser"; // import the modal

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalStaff: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false); // state to toggle modal

  const getStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDashboardStats(101);
      setStats(data);
    } catch {
      setError("Failed to load stats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: number | string }) => (
    <div className="bg-gray-200 border-l-4 border-blue-800 rounded-xl shadow-sm hover:shadow-md transform transition duration-300 hover:-translate-y-1 cursor-pointer p-6 flex flex-col items-center justify-center min-w-[150px]">
      {loading ? (
        <div className="loader border-t-4 border-gray-700 border-solid rounded-full w-10 h-10 animate-spin"></div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center">{error}</p>
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
      <p className="mt-2 text-gray-700 font-medium text-center">{title}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans relative p-3 md:p-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Total Appointments Today" value={stats.appointmentsToday} />
        <StatCard title="New Patients This Week" value={stats.newPatientsThisWeek} />
        <StatCard title="Doctors on Staff" value={stats.totalDoctors} />
        <StatCard title="Medical Staff" value={stats.totalStaff} />
      </div>

      <div className="bg-white shadow rounded-2xl p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-blue-800 transition"
            onClick={() => setShowAddUser(true)} // open modal
          >
            <FaUserPlus className="text-lg" /> Add New User
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-blue-800 transition">
            <FaClipboardList className="text-lg" /> View Audit Log
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-blue-800 transition">
            <FaIdCard className="text-lg" /> View KYC Details
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-2xl p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Clinic Announcements</h2>
        <div className="bg-gray-200 border-l-4 border-blue-800 rounded-xl p-4 text-gray-700">
          The clinic will be closed for the holiday on December 25th.
        </div>
      </div>

      {/* Conditionally render AddUser modal */}
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
