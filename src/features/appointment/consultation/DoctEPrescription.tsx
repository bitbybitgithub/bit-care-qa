import React, { useState } from "react";
import axios from "axios";

import type { PrescriptionForm } from "../../../types/appointmentTypes";

const DoctEPrescription: React.FC = () => {
  const [form, setForm] = useState<PrescriptionForm>({
    patientId: "23",
    patientName: "John Doe",
    patientDob: "1990-05-15",
    patientGender: "Male",
    notes: "",
  });


  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getPayload = () => ({
    patient_id: Number(form.patientId),
    doctor_id: 5,
    clinic_id: 3,
    appointment_date: "2025-10-20",
    appointment_status: "Complete",
    consultation_notes: "dfdsf",
    diagnosis: "dfds",
    prescription: form.notes,
    appointment_id: 1,
    created_by: "doctor",
  });

  const sendRequest = async (
    actionType: "prescribe" | "followup" | "refer"
  ) => {

    try {
      const payload = { ...getPayload(), action_type: actionType };

      if (!payload.prescription || payload.prescription.trim() === "") {
        return;
      }

      const response = await axios.post(
        "http://localhost:8989/api/doctors/ePrescription/addEPrescription",
        payload
      );
      setForm((prev) => ({ ...prev, notes: "" }));
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  return (

      <div className="mt-4">
        {/* className=" w-full m-4 p-6 bg-[var(--color-white)]  rounded-2xl shadow-lg border border-gray-200"> */}
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Rx(Prescription Entry)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g., Atorvastatin 20mg, 1 tablet PO nightly. Take for 30 days."
              rows={4}
              className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            />

            {/* Capture and Print Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 my-4">
              <button className="flex-1 border border-green-500 text-green-600 rounded-md py-2 hover:bg-green-50 transition">
                Capture from Device
              </button>
              <button className="flex-1 border border-gray-400 text-gray-600 rounded-md py-2 hover:bg-gray-100 transition">
                Print Prescription
              </button>
            </div>

            {/* Bottom Action Buttons */}
       
            {/* <div className="flex flex-wrap gap-3 justify-between">
              <button
                onClick={() => sendRequest("prescribe")}
                disabled={loading.prescribe}
                className="bg-blue-500 text-white rounded-md px-4 py-2 font-semibold hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading.prescribe ? "Saving..." : "Dispense Medication"}
              </button>

              <button
                onClick={() => sendRequest("refer")}
                disabled={loading.refer}
                className="bg-green-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading.refer ? "Saving..." : "Refer To"}
              </button>

              <button
                onClick={() => sendRequest("followup")}
                disabled={loading.followup}
                className="bg-orange-500 text-white rounded-md px-4 py-2 font-semibold hover:bg-orange-600 transition disabled:opacity-50"
              >
                {loading.followup ? "Saving..." : "Set Follow-up"}
              </button>

              <button
                type="button"
                className="bg-gray-400 text-white rounded-md px-4 py-2 font-semibold hover:bg-gray-500 transition"
              >
                Complete
              </button>
            </div> */}
      </div>
  );
};

export default DoctEPrescription;
