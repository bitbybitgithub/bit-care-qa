// // api call ----------------------------------------------------------------------
// import React, { useEffect, useState } from "react";
// import { FaUserEdit, FaPlus, FaSearch } from "react-icons/fa";
// import AddUser from "../../features/component/AddUser";
// import DeactivateUser from "./DeactivateUser";
// import { getDoctorList } from "../../api/DocListApi";
// import type { Doctor } from "../../api/DocListApi";

// const Users: React.FC = () => {
//   const [doctors, setDoctors] = useState<Doctor[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showAddUser, setShowAddUser] = useState(false);
//   const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
//   const [loading, setLoading] = useState(true);
  

//   useEffect(() => {
//     const fetchDoctors = async () => {
//       try {
//         setLoading(true);
//         const response = await getDoctorList();
//         setDoctors(response);
//       } catch (error) {
//         console.error("Failed to fetch doctor list", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDoctors();
//   }, []);

//   const getRandomColor = () => {
//     const hue = Math.floor(Math.random() * 360);
//     return `hsl(${hue}, 50%, 70%)`;
//   };

//   const doctorColors = React.useMemo(() => {
//     const map: Record<number, string> = {};
//     doctors.forEach((d) => (map[d.id] = getRandomColor()));
//     return map;
//   }, [doctors]);

//   const filteredDoctors = doctors.filter(
//     (doc) =>
//       doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (doc.specialist?.toLowerCase() || "").includes(searchTerm.toLowerCase())
//   );

//   const handleToggleStatus = (id: number, newStatus: "Active" | "Inactive", phone?: string) => {
//   setDoctors((prev) =>
//     prev.map((d) =>
//       d.id === id
//         ? {
//             ...d,              // copy existing fields
//             status: newStatus, // update status
//             phone,             // optionally update phone
//           }
//         : d
//     )
//   );
//   setSelectedDoctor(null);
// };


//   return (
//     <div className="p-4 sm:p-6 bg-gray-50 min-h-screen mt-4 rounded-2xl">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 w-full">
//         <button
//           onClick={() => setShowAddUser(true)}
//           className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl shadow transition w-full sm:w-auto justify-center"
//         >
//           <FaPlus /> Add New User
//         </button>

//         <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
//           <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search doctor or specialist..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-10 pr-3 py-2 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
//           />
//         </div>
//       </div>

//       {/* Doctor Grid */}
//       {loading ? (
//         <p className="text-center text-gray-500 py-10">Loading doctors...</p>
//       ) : filteredDoctors.length === 0 ? (
//         <p className="text-gray-500 text-center py-6">No doctors found.</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
//           {filteredDoctors.map((doc) => (
            
//             <div
//   key={doc.id}
//   className="relative bg-white border-b-4 border rounded-3xl mt-6 shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:-translate-y-1 hover:shadow-xl w-full"
// >
//   {/* Status Badge - only color */} 
//   <span
//     className={`absolute top-4 right-4 w-3 h-3 rounded-full shadow-md ${
//       doc.status === "Active" ? "bg-green-500" : "bg-red-500"
//     }`}
//   />

//   {/* Avatar */}
//   <div
//     className="absolute -top-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-md flex items-center justify-center border-4 border-white"
//     style={{ backgroundColor: doctorColors[doc.id] }}
//   >
//     <span className="text-xl sm:text-2xl font-bold text-white">
//       {doc.name
//         .replace(/^Dr\.\s*/i, "")
//         .split(" ")
//         .filter((w) => w.length > 0)
//         .map((w) => w[0])
//         .join("")
//         .toUpperCase()}
//     </span>
//   </div>

//   <div className="mt-12">
//     <h2 className="text-base sm:text-lg font-semibold text-gray-800">{doc.name}</h2>
//     <p className="text-gray-500 text-xs sm:text-sm mt-1">{doc.specialist}</p>
//   </div>

//   {/* Activate/Deactivate button */}
//   <button
//     onClick={() => setSelectedDoctor(doc)}
//     className={`mt-5 w-full sm:w-28 py-2.5 text-white rounded-2xl font-medium shadow-md transition-all ${
//       doc.status === "Active"
//         ? "bg-orange-400 hover:opacity-90"
//         : "bg-green-400  hover:opacity-90"
//     }`}
//   >
//     {doc.status === "Active" ? "Deactivate" : "Activate"}
//   </button>
// </div>

//           ))}
//         </div>
//       )}

//       {/* Modals */}
//       {showAddUser && <AddUser onClose={() => setShowAddUser(false)} />}
//       {selectedDoctor && (
//         <DeactivateUser
//           doctor={selectedDoctor}
//           onClose={() => setSelectedDoctor(null)}
//           onToggleStatus={handleToggleStatus}
//         />
//       )}
//     </div>
//   );
// };

// export default Users;


import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import AddUser from "../../features/component/AddUser";
import DeactivateUser from "./DeactivateUser";
import { getDoctorList, type Doctor } from "../../api/DocListApi";
import { deleteDoctorApi } from "../../api/DeleteDocApi";

const Users: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await getDoctorList();
        setDoctors(response);
      } catch (error) {
        console.error("❌ Failed to fetch doctor list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Random avatar colors
  const doctorColors = useMemo(() => {
    const map: Record<number, string> = {};
    doctors.forEach((d) => {
      const hue = Math.floor(Math.random() * 360);
      map[d.id] = `hsl(${hue}, 50%, 70%)`;
    });
    return map;
  }, [doctors]);

  // Filtered search
  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialist?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Toggle status
  const handleToggleStatus = (id: number, newStatus: "Active" | "Inactive", phone?: string) => {
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: newStatus,
              phone,
            }
          : d
      )
    );
    setSelectedDoctor(null);
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (!window.confirm(`Are you sure you want to delete ${doctor.name}?`)) return;
    if (!doctor.clinic_id || !doctor.id) {
      alert("Invalid doctor data: missing clinic_id or id");
      
      return;

    }

    try {
      setDeletingId(doctor.id);
      const response = await deleteDoctorApi({
        clinic_id: doctor.clinic_id,
        doctor_id: doctor.id,
      });

      if (response.success) {
        setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
        alert(response.message);
      } else {
        alert(response.message || "Failed to delete doctor");
      }
    } catch (error: any) {
      console.error("❌ Delete doctor failed:", error);
      alert(error.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

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

      {/* Doctor Grid */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading doctors...</p>
      ) : filteredDoctors.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No doctors found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="relative bg-white border-b-4 border rounded-3xl mt-6 shadow-lg p-6 flex flex-col items-center text-center transition-transform transform hover:-translate-y-1 hover:shadow-xl w-full"
            >
              {/* Status dot */}
              <span
                className={`absolute top-4 right-4 w-3 h-3 rounded-full shadow-md ${
                  doc.status === "Active" ? "bg-green-500" : "bg-red-500"
                }`}
              />

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteDoctor(doc)}
                disabled={deletingId === doc.id}
                title="Delete Doctor"
                className={`absolute top-3 left-3 text-gray-400 hover:text-red-500 transition ${
                  deletingId === doc.id ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {deletingId === doc.id ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <FaTrash size={16} />
                )}
              </button>

              {/* Avatar */}
              <div
                className="absolute -top-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-md flex items-center justify-center border-4 border-white"
                style={{ backgroundColor: doctorColors[doc.id] }}
              >
                <span className="text-xl sm:text-2xl font-bold text-white">
                  {doc.name
                    .replace(/^Dr\.\s*/i, "")
                    .split(" ")
                    .filter((w) => w.length > 0)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="mt-12">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">{doc.name}</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">{doc.specialist}</p>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => setSelectedDoctor(doc)}
                className={`mt-5 w-full sm:w-28 py-2.5 text-white rounded-2xl font-medium shadow-md transition-all ${
                  doc.status === "Active"
                    ? "bg-orange-400 hover:opacity-90"
                    : "bg-green-400 hover:opacity-90"
                }`}
              >
                {doc.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddUser && <AddUser onClose={() => setShowAddUser(false)} clinicId={0} />}
      {selectedDoctor && (
        <DeactivateUser
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default Users;


