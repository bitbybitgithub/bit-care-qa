// import { useDispatch } from "react-redux";
// import { FaClipboardList, FaIdCard, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
// import { logout } from "../../redux/authSlice";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [showConfirm, setShowConfirm] = useState(false);

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate("/");
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100 font-sans relative">
//       {/* Confirmation Alert (Top Positioned) */}
//       {showConfirm && (
//         <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-4 z-50 animate-fadeIn">
//           <h2 className="text-lg font-semibold text-gray-800">Confirm Logout</h2>
//           <p className="text-sm text-gray-600 mt-1">
//             Are you sure you want to log out?
//           </p>
//           <div className="flex justify-end gap-3 mt-4">
//             <button
//               onClick={() => setShowConfirm(false)}
//               className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleLogout}
//               className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <main className="flex-1 p-8">
       

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
//           <div className="bg-blue-500 text-white rounded-2xl transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer shadow p-6">
//             <p className="text-3xl font-bold">124</p>
//             <p className="mt-2">Total Appointments Today</p>
//           </div>
//           <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
//             <p className="text-3xl font-bold">18</p>
//             <p className="mt-2">New Patients This Week</p>
//           </div>
//           <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
//             <p className="text-3xl font-bold">1</p>
//             <p className="mt-2">Doctors on Staff</p>
//           </div>
//           <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
//             <p className="text-3xl font-bold">2</p>
//             <p className="mt-2">Medical Staff</p>
//           </div>
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white shadow rounded-2xl p-6 mb-6">
//           <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
//           <div className="flex gap-4">
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaUserPlus className="text-lg" />
//               Add New User
//             </button>
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaClipboardList className="text-lg" />
//               View Audit Log
//             </button>
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaIdCard className="text-lg" />
//               View KYC Details
//             </button>
//           </div>
//         </div>

//         {/* Announcements */}
//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-xl font-semibold mb-4">Clinic Announcements</h2>
//           <div className="bg-gray-200 rounded-2xl p-4 text-gray-700">
//             The clinic will be closed for the holiday on December 25th
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;


// import { useDispatch } from "react-redux";
// import { FaClipboardList, FaIdCard, FaUserPlus } from "react-icons/fa";
// import { logout } from "../../redux/authSlice";
// import { useNavigate } from "react-router-dom";
// import { useState, useEffect } from "react";
// import axios from "axios";

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [showConfirm, setShowConfirm] = useState(false);

//   // State for stats
//   const [stats, setStats] = useState({
//     totalDoctors: 0,
//     totalStaff: 0,
//     totalPatients: 0,
//     appointmentsToday: 0,
//     newPatientsThisWeek: 0,
//   });

//   const [loading, setLoading] = useState(true); // Loading state
//   const [error, setError] = useState(""); // Error state

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate("/");
//   };

//   // Fetch dashboard stats
//   const fetchStats = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const response = await axios.post(
//         "http://localhost:8989/api/clinics/dashboard/overview",
//         { clinic_id: 101 }
//       );
//       setStats(response.data);
//     } catch (err) {
//       console.error("Failed to fetch stats:", err);
//       setError("Failed to load stats. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, []);

//   // Card component with error handling
//   const StatCard = ({ title, value }: { title: string; value: number | string }) => (
//     <div className="bg-blue-500 text-white rounded-2xl transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer shadow p-6 flex flex-col items-center justify-center">
//       {loading ? (
//         <div className="loader border-t-4 border-white border-solid rounded-full w-10 h-10 animate-spin"></div>
//       ) : error ? (
//         <p className="text-sm text-red-200 text-center">{error}</p>
//       ) : (
//         <p className="text-3xl font-bold">{value}</p>
//       )}
//       <p className="mt-2 text-center">{title}</p>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen bg-gray-100 font-sans relative">
//       {showConfirm && (
//         <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-4 z-50 animate-fadeIn">
//           <h2 className="text-lg font-semibold text-gray-800">Confirm Logout</h2>
//           <p className="text-sm text-gray-600 mt-1">Are you sure you want to log out?</p>
//           <div className="flex justify-end gap-3 mt-4">
//             <button
//               onClick={() => setShowConfirm(false)}
//               className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleLogout}
//               className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       )}

//       <main className="flex-1 p-8">
//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
//           <StatCard title="Total Appointments Today" value={stats.appointmentsToday} />
//           <StatCard title="New Patients This Week" value={stats.newPatientsThisWeek} />
//           <StatCard title="Doctors on Staff" value={stats.totalDoctors} />
//           <StatCard title="Medical Staff" value={stats.totalStaff} />
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white shadow rounded-2xl p-6 mb-6">
//           <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
//           <div className="flex gap-4">
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaUserPlus className="text-lg" />
//               Add New User
//             </button>
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaClipboardList className="text-lg" />
//               View Audit Log
//             </button>
//             <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
//               <FaIdCard className="text-lg" />
//               View KYC Details
//             </button>
//           </div>
//         </div>

//         {/* Announcements */}
//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-xl font-semibold mb-4">Clinic Announcements</h2>
//           <div className="bg-gray-200 rounded-2xl p-4 text-gray-700">
//             The clinic will be closed for the holiday on December 25th
//           </div>
//         </div>
//       </main>

//       {/* Loader CSS */}
//       <style>{`
//         .loader {
//           border-top-color: transparent;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;

import { useDispatch } from "react-redux";
import { FaClipboardList, FaIdCard, FaUserPlus } from "react-icons/fa";
// import { logout } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const [showConfirm, setShowConfirm] = useState(false);

  // State for stats
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalStaff: 0,
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsThisWeek: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // const handleLogout = () => {
  //   dispatch(logout());
  //   navigate("/");
  // };

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:8989/api/clinics/dashboard/overview",
        { clinic_id: 101 }
      );
      setStats(response.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("Failed to load stats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({ title, value }: { title: string; value: number | string }) => (
    <div className="bg-blue-500 text-white rounded-2xl transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer shadow p-6 flex flex-col items-center justify-center min-w-[150px]">
      {loading ? (
        <div className="loader border-t-4 border-white border-solid rounded-full w-10 h-10 animate-spin"></div>
      ) : error ? (
        <p className="text-sm text-red-200 text-center">{error}</p>
      ) : (
        <p className="text-3xl font-bold">{value}</p>
      )}
      <p className="mt-2 text-center">{title}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans relative p-3 md:p-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Total Appointments Today" value={stats.appointmentsToday} />
        <StatCard title="New Patients This Week" value={stats.newPatientsThisWeek} />
        <StatCard title="Doctors on Staff" value={stats.totalDoctors} />
        <StatCard title="Medical Staff" value={stats.totalStaff} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-2xl p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300 transition">
            <FaUserPlus className="text-lg" />
            Add New User
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300 transition">
            <FaClipboardList className="text-lg" />
            View Audit Log
          </button>
          <button className="flex-1 min-w-[150px] flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300 transition">
            <FaIdCard className="text-lg" />
            View KYC Details
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-white shadow rounded-2xl p-4 md:p-6">
        <h2 className="text-xl font-semibold mb-4">Clinic Announcements</h2>
        <div className="bg-gray-200 rounded-2xl p-4 text-gray-700">
          The clinic will be closed for the holiday on December 25th
        </div>
      </div>

      {/* Loader CSS */}
      <style>{`
        .loader {
          border-top-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

