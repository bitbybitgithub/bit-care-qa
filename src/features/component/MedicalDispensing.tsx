import React, { useState } from "react";

interface MedicalDispensingProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  error?: string;
  data: any[];
}

const MedicalDispensing: React.FC<MedicalDispensingProps> = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
}) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Pagination logic
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading)
    return (
      <div className="text-center py-4 text-gray-500 animate-pulse">
        Loading medical dispensing records...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-4 text-red-500">
        ⚠️ Error: {error}
      </div>
    );

  if (!data || data.length === 0)
    return (
      <div className="text-center py-4 text-gray-500">
        No medical dispensing records found.
      </div>
    );

  return (
    <div className={`space-y-4 ${classProp}`}>
      {/* ✅ Table Layout */}
      <div className="overflow-x-auto bg-white shadow-md border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
             
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Patient Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Appointment ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Doctor
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-blue-50 transition-all duration-200"
              >
              
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  {item.patient_name || "Unknown"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.appointment_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.doctor_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.appointment_date
                    ? new Date(item.appointment_date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    View Prescription
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ✅ Pagination Controls */}
        <div className="flex justify-between items-center p-3 bg-gray-50 border-t rounded-b-xl">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * rowsPerPage + 1}–
            {Math.min(currentPage * rowsPerPage, data.length)} of {data.length}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal View */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-lg"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Prescription Details
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Patient:</strong> {selectedItem.patient_name}
              </p>
              <p>
                <strong>Doctor:</strong> {selectedItem.doctor_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {selectedItem.appointment_date
                  ? new Date(selectedItem.appointment_date).toLocaleDateString()
                  : "-"}
              </p>
              <p>
                <strong>Appointment ID:</strong> {selectedItem.appointment_id}
              </p>
            </div>

            {selectedItem.medicines && selectedItem.medicines.length > 0 ? (
              <div className="mt-4 border-t pt-3">
                <h4 className="font-semibold text-gray-700 mb-1">
                  Medicines Prescribed:
                </h4>
                <ul className="list-disc ml-6 text-gray-700 text-sm space-y-1">
                  {selectedItem.medicines.map((med: any, idx: number) => (
                    <li key={idx}>
                      {med.medicine_name} — {med.quantity} pcs
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic mt-3">
                No medicines available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalDispensing;
