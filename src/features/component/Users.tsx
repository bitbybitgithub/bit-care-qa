import React, { useEffect, useState } from "react";
import { FaUserEdit, FaPlus, FaSearch } from "react-icons/fa";
import AddUser from "../../features/component/AddUser";
import DeactivateUser from "./DeactivateUser";
import { getDoctorSpecializationList } from "../../api/DocListApi"; 

const Users = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        setLoading(true);
        const data = await getDoctorSpecializationList();
        console.log(" Specialization API response:", data);
        const mappedDoctors = data.map((item: any, index: number) => ({
          id: item.speciality_id,
          name: `Dr. ${item.title} Specialist`, 
          specialist: item.title,
          status: item.is_active === "1" ? "Active" : "Inactive",
        }));
        // console.log("Mapped doctor list:", mappedDoctors);
        setDoctors(mappedDoctors);
      } catch (error) {
        console.error("Failed to fetch doctor list", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, []);

  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 50%, 70%)`;
  };

  const doctorColors = React.useMemo(() => {
    const map: Record<number, string> = {};
    doctors.forEach((d) => (map[d.id] = getRandomColor()));
    return map;
  }, [doctors]);

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen mt-4 rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl shadow transition w-full sm:w-auto justify-center"
        >
          <FaPlus /> Add New User
        </button>

        <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
          <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor or specialist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading doctors...</p>
      ) : filteredDoctors.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No doctors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="relative bg-white border-b-4 rounded-3xl mt-6 shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:-translate-y-1 hover:shadow-xl w-full"
            >
              {/* Circle Avatar */}
              <div
                className="absolute -top-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-md flex items-center justify-center border-4 border-white"
                style={{ backgroundColor: doctorColors[doc.id] }}
              >
                <span className="text-xl sm:text-2xl font-bold text-white">
                 {doc.name
                  .split(" ")
                  .filter((w: string) => w.length > 0 && w.toLowerCase() !== "dr.")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  }

                </span>
              </div>

              <div className="mt-12">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  {doc.name}
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  {doc.specialist}
                </p>
                <span
                  className={`inline-block mt-3 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    doc.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <button
                onClick={() => setSelectedDoctor(doc)}
                className={`mt-5 w-full sm:w-28 py-2.5 text-white rounded-2xl font-medium shadow-md transition-all ${
                  doc.status === "Active"
                    ? "bg-gradient-to-r from-orange-400 to-yellow-500 hover:opacity-90"
                    : "bg-gradient-to-r from-green-400 to-emerald-500 hover:opacity-90"
                }`}
              >
                {doc.status === "Active" ? "Deactivate" : "Activate"}
              </button>

              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-blue-600"
                title="Edit Doctor"
              >
                <FaUserEdit size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}
      {selectedDoctor && (
        <DeactivateUser
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onToggleStatus={(id, newStatus, phone) => {
            setDoctors((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, status: newStatus, phone } : d
              )
            );
            setSelectedDoctor(null);
          }}
        />
      )}
    </div>
  );
};

export default Users;
