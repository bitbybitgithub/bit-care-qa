import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";

const Users = () => {
  const [doctors, setDoctors] = useState([
    { id: 1, name: "Dr. Aditi Sharma", specialist: "Cardiologist", status: "Active" },
    { id: 2, name: "Dr. Rohan Verma", specialist: "Dermatologist", status: "Inactive" },
    { id: 3, name: "Dr. Priya Nair", specialist: "Pediatrician", status: "Active" },
    { id: 4, name: "Dr. Sameer Khan", specialist: "Orthopedic", status: "Active" },
    { id: 5, name: "Dr. Neha Joshi", specialist: "Neurologist", status: "Inactive" },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  // Generate random pastel color
  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`; // soft pastel tones
  };

  // Assign a random color to each doctor once
  const doctorColors = React.useMemo(() => {
    const map: Record<number, string> = {};
    doctors.forEach((d) => {
      map[d.id] = getRandomColor();
    });
    return map;
  }, [doctors]);

  const handleEdit = (id: number) => {
    const doc = doctors.find((d) => d.id === id);
    if (doc) console.log("Edit doctor:", doc);
  };

  const handleDelete = (id: number) => {
    const doc = doctors.find((d) => d.id === id);
    if (doc && window.confirm(`Are you sure you want to delete ${doc.name}?`)) {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      console.log("Deleted doctor:", doc);
    }
  };

  const handleAddClinic = () => {
    console.log("Add new clinic clicked");
  };

  // Filter doctors by search term
  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header with Add Button and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <button
          onClick={handleAddClinic}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-2xl shadow transition"
        >
          <FaPlus /> Add New Clinic
        </button>

        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor or specialist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Doctor list */}
      <div className="flex flex-col gap-3">
        {filteredDoctors.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No doctors found.</p>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-white shadow-md rounded-2xl p-3 hover:shadow-lg transition"
              style={{ borderLeft: `6px solid ${doctorColors[doc.id]}` }}
            >
              <div className="flex items-center gap-3">
                {/* Profile circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: doctorColors[doc.id] }}
                >
                  <span className="text-white font-bold text-lg">
                    {doc.name[0]}
                  </span>
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
                    doc.status === "Active"
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100"
                  }`}
                >
                  {doc.status}
                </span>

                {/* Action icons */}
                <button
                  onClick={() => handleEdit(doc.id)}
                  className="p-1 text-blue-500 hover:text-blue-700"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Users;

