import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const Users = () => {
  const doctors = [
    { id: 1, name: "Dr. Aditi Sharma", specialist: "Cardiologist", status: "Active" },
    { id: 2, name: "Dr. Rohan Verma", specialist: "Dermatologist", status: "Inactive" },
    { id: 3, name: "Dr. Priya Nair", specialist: "Pediatrician", status: "Active" },
    { id: 4, name: "Dr. Sameer Khan", specialist: "Orthopedic", status: "Active" },
    { id: 5, name: "Dr. Neha Joshi", specialist: "Neurologist", status: "Inactive" },
  ];

  const colors = ["bg-blue-300", "bg-green-300", "bg-purple-300", "bg-yellow-300", "bg-pink-300"];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <div className="flex flex-col gap-3">
        {doctors.map((doc, index) => (
          <div
            key={doc.id}
            className="flex items-center justify-between bg-gray-200 shadow-md rounded-4xl p-3 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              {/* Animated fake profile circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[index % colors.length]}`}
              >
                <span className="text-white font-bold text-lg">{doc.name[0]}</span>
              </div>

              <div className="flex flex-col">
                <h2 className="font-semibold text-md">{doc.name}</h2>
                <p className="text-gray-500 text-sm">{doc.specialist}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status pill */}
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  doc.status === "Active" ? "text-green-700" : "text-red-700"
                }`}
              >
                {doc.status}
              </span>

              {/* Action icons */}
              <button className="p-1 text-blue-500 hover:text-blue-700">
                <FaEdit size={16} />
              </button>
              <button className="p-1 text-red-500 hover:text-red-700">
                <FaTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
