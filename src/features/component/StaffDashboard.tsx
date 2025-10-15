import React from "react";
import {
  FaUserInjured,
  FaClipboardList,
  FaUserMd,
  FaEnvelopeOpenText,
  FaPlusCircle,
} from "react-icons/fa";
import Cards from "../../components/common/Cards";
import { FaPeopleGroup } from "react-icons/fa6";


const StaffDashboard: React.FC = () => {
  const handleCardClick = (title: string) => {
    console.log(`${title} card clicked`);
  };

  const cardItems = [
    {
      title: "Patients in Queue",
      value: 8,
      icon: <FaPeopleGroup />,
      color: "bg-blue-100 text-blue-800 border-blue-400",
      onClick: () => handleCardClick("Patients in Queue"),
    },
    {
      title: "Tasks Due Today",
      value: 5,
      icon: <FaClipboardList />,
      color: "bg-yellow-100 text-yellow-800 border-yellow-400",
      onClick: () => handleCardClick("Tasks Due Today"),
    },
    {
      title: "Available Doctors",
      value: 12,
      icon: <FaUserMd />,
      color: "bg-green-100 text-green-800 border-green-400",
      onClick: () => handleCardClick("Available Doctors"),
    },
    {
      title: "Pending Messages",
      value: 3,
      icon: <FaEnvelopeOpenText />,
      color: "bg-red-100 text-red-800 border-red-400",
      onClick: () => handleCardClick("Pending Messages"),
    },
  ];

  const patientQueue = [
    { name: "John Doe", status: "Waiting", waitingMinutes: 15, doctor: "Dr. Mangal" },
    { name: "Priya Sharma", status: "In Consultation", waitingMinutes: 0, doctor: "Dr. Pappu Sharma" },
    { name: "Ravi Patel", status: "Waiting", waitingMinutes: 10, doctor: "Dr. Sneha Deshmukh" },
    { name: "Meena Gupta", status: "Completed", waitingMinutes: 0, doctor: "Dr. Mehta" },
  ];

  const handleAddWalkIn = () => {
    console.log("Add Walk-in Patient clicked");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Dashboard Cards */}
      <Cards
        items={cardItems}
        gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
      />

      {/* Patient Queue Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            Patient Queue
          </h3>
          <button
            onClick={handleAddWalkIn}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
          >
            <FaPlusCircle /> Add Walk-in Patient
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-gray-700 font-semibold">Name</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-gray-700 font-semibold">Status</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-gray-700 font-semibold">Waiting (mins)</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 text-left text-gray-700 font-semibold">Assigned Doctor</th>
              </tr>
            </thead>
            <tbody>
              {patientQueue.map((patient, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{patient.name}</td>
                  <td
                    className={`py-2 sm:py-3 px-3 sm:px-4 font-medium ${
                      patient.status === "Waiting"
                        ? "text-yellow-600"
                        : patient.status === "In Consultation"
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    {patient.status}
                  </td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{patient.waitingMinutes}</td>
                  <td className="py-2 sm:py-3 px-3 sm:px-4">{patient.doctor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
