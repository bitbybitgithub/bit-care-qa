import React from "react";
import { FaUser } from "react-icons/fa";

const Users = () => {
  const doctors = [
    { id: 1, name: "Dr. Aditi Sharma", specialist: "Cardiologist", status: "Active" },
    { id: 2, name: "Dr. Rohan Verma", specialist: "Dermatologist", status: "Inactive" },
    { id: 3, name: "Dr. Priya Nair", specialist: "Pediatrician", status: "Active" },
    { id: 4, name: "Dr. Sameer Khan", specialist: "Orthopedic", status: "Active" },
    { id: 5, name: "Dr. Neha Joshi", specialist: "Neurologist", status: "Inactive" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Users (Doctors)</h1>

      <div className="flex flex-col gap-4">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              {/* Animated person icon */}
              <div className="text-blue-500 animate-bounce">
                <FaUser size={30} />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{doc.name}</h2>
                <p className="text-gray-500">{doc.specialist}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                Edit
              </button>
              <button className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
