import React, { useState } from "react";

interface MedicalDispensingProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  error?: string;
  data: any[]; // 👈 Add data prop
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
      {data.map((item, index) => (
        <div
          key={index}
          className="bg-white shadow-md border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {item.patient_name || "Unknown Patient"}
              </h3>
              <p className="text-sm text-gray-600">
                Appointment ID: {item.appointment_id}
              </p>
              <p className="text-sm text-gray-600">
                Doctor: {item.doctor_name}
              </p>
              <p className="text-sm text-gray-600">
                Date:{" "}
                {item.appointment_date
                  ? new Date(item.appointment_date).toLocaleDateString()
                  : "-"}
              </p>
            </div>

            <div className="text-right">
              <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold inline-block mb-2">
                {mode === "staff" ? "Staff View" : "Doctor View"}
              </div>
              {/* ✅ View Prescription Button */}
              <button
                onClick={() => setSelectedItem(item)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                View Prescription
              </button>
            </div>
          </div>

          {/* Medicine details */}
          {item.medicines && item.medicines.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Dispensed Medicines:
              </h4>
              <ul className="list-disc ml-6 text-gray-700 text-sm space-y-1">
                {item.medicines.map((med: any, idx: number) => (
                  <li key={idx}>
                    {med.medicine_name} — {med.quantity} pcs
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

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
                <strong>Appointment Date:</strong>{" "}
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
