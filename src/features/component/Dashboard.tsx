import { useDispatch } from "react-redux";
import { FaClipboardList, FaIdCard, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { logout } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans relative">
      {/* Confirmation Alert (Top Positioned) */}
      {showConfirm && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-gray-200 shadow-lg rounded-xl p-4 z-50 animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-800">Confirm Logout</h2>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to log out?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-2xl shadow hover:bg-red-600 transition"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-500 text-white rounded-2xl transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer shadow p-6">
            <p className="text-3xl font-bold">124</p>
            <p className="mt-2">Total Appointments Today</p>
          </div>
          <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
            <p className="text-3xl font-bold">18</p>
            <p className="mt-2">New Patients This Week</p>
          </div>
          <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
            <p className="text-3xl font-bold">1</p>
            <p className="mt-2">Doctors on Staff</p>
          </div>
          <div className="bg-blue-500 text-white transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer rounded-2xl shadow p-6">
            <p className="text-3xl font-bold">2</p>
            <p className="mt-2">Medical Staff</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
              <FaUserPlus className="text-lg" />
              Add New User
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
              <FaClipboardList className="text-lg" />
              View Audit Log
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-2xl hover:bg-indigo-300">
              <FaIdCard className="text-lg" />
              View KYC Details
            </button>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-white shadow rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Clinic Announcements</h2>
          <div className="bg-gray-200 rounded-2xl p-4 text-gray-700">
            The clinic will be closed for the holiday on December 25th
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
