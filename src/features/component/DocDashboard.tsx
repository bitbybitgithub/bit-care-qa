import React from "react";
import { HiClipboardList } from "react-icons/hi";
import { FaNotesMedical } from "react-icons/fa";
import { GiMedicines } from "react-icons/gi";
import { RiUserSharedLine } from "react-icons/ri";
import PatientProgressCard from "../../components/common/PatientProgressCard";
import Cards from "../../components/common/Cards";
import PatientQueue from "./PatientQueue";

const DocDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center mt-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 self-start">
        Today's Clinic Workflow
      </h1>

      <div className="flex flex-col gap-6 w-full max-w-5xl">
        {/* ================= Scheduling Card ================= */}
        {/* <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient's Queue</h2>

          <div className="flex flex-col gap-4">
            {patients.map((patient, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative bg-[#f9f9ff]"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-l-2xl"></div>

                <div className="flex flex-col items-center sm:items-start w-full sm:w-1/4 px-4">
                  <p className="text-xs text-gray-500">{patient.time}</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {patient.name}
                  </p>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

                <div className="w-full sm:w-1/3 text-center sm:text-left mt-3 sm:mt-0 px-4">
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="text-gray-800 font-medium">{patient.reason}</p>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

                <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm">
                    Start Consultation
                  </button>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gray-300"></div>

                <div className="w-full sm:w-auto flex justify-center mt-3 sm:mt-0 px-2">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                      patient.status === "In Queue"
                        ? "bg-[#c3e7ff] text-[#0074b7]"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div> */}
         <PatientQueue doctorId={2} />

        {/* ================= Clinical Actions Card using Cards component ================= */}
        <Cards
  gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  items={[
    {
      title: "Patients Records",
      icon: <HiClipboardList className="text-3xl mb-2" />,
      color: "bg-amber-500 text-white",
      onClick: () => console.log("Patients Records clicked"),
    },
    {
      title: "Add Diagnosis Notes",
      icon: <FaNotesMedical className="text-3xl mb-2" />,
      color: "bg-blue-500 text-white",
      onClick: () => console.log("Add diagnosis notes clicked"),
    },
    {
      title: "Manage Medication",
      icon: <GiMedicines className="text-3xl mb-2" />,
      color: "bg-fuchsia-500 text-white",
      onClick: () => console.log("Manage medication clicked"),
    },
    {
      title: "Refer Patient",
      icon: <RiUserSharedLine className="text-3xl mb-2" />,
      color: "bg-green-500 text-white",
      onClick: () => console.log("Refer Patient clicked"),
    },
  ]}
/>


        {/* ================= Patient Progress Card ================= */}
        <PatientProgressCard />
      </div>
    </div>
  );
};

export default DocDashboard;









