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
import PatientQueue from "../../features/component/PatientQueue"; 

const StaffDashboard: React.FC = () => {
  const handleCardClick = (title: string) => {
    console.log(`${title} card clicked`);
  };

  const cardItems = [
    {
      title: "Patients in Queue",
      value: 8,
      icon: <FaPeopleGroup />,
      color: "bg-violet-200 text-blue-800 border-violet-600",
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

  // Dummy data for staff view
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
      <Cards items={cardItems} gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-2" />

      {/* Patient Queue Section */}
      <PatientQueue
        mode="staff"
        patientsData={patientQueue}
        className="bg-white rounded-xl shadow-md p-4 sm:p-6"
        onAddWalkIn={handleAddWalkIn}
      />
    </div>
  );
};

export default StaffDashboard;
