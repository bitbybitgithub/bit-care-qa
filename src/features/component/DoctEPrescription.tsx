import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPills, FaUserMd, FaRedoAlt } from "react-icons/fa";

interface PrescriptionForm {
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  notes: string;
}

const DoctEPrescription: React.FC = () => {
  const [form, setForm] = useState<PrescriptionForm>({
    patientId: "23",
    patientName: "John Doe",
    patientDob: "1990-05-15",
    patientGender: "Male",
    notes: "",
  });

  const [loading, setLoading] = useState({
    prescribe: false,
    followup: false,
    refer: false,
  });

    const [prescriptiondata, setPrescription] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  // useEffect(() => {
  //   const fetchPrescriptions = async () => {
  //     try {
  //       const response = await axios.post(
  //         "http://localhost:8989/api/doctors/getEPrescription",
  //         {
  //           patient_id: 23,
  //           doctor_id: 5,
  //         }
  //       );
  //       if (response.data?.body ) {
        
  //         setPrescription(response.data.body);
  //       } else {
  //         setPrescription([]);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching prescriptions:", error);
  //       toast.error("⚠️ Failed to fetch prescriptions", {
  //         style: {
  //           background: "#B91C1C",
  //           color: "#fff",
  //           borderRadius: "12px",
  //         },
  //       });
  //     } finally {
  //       setIsFetching(false);
  //     }
  //   };

  //   fetchPrescriptions();
  // }, [form.patientId]);
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
    setLoading((prev) => ({ ...prev, [actionType]: true }));

    try {
      const payload = { ...getPayload(), action_type: actionType };

      if (!payload.prescription || payload.prescription.trim() === "") {
        toast.warn("Please enter a prescription before submitting.", {
          style: {
            background: "#F59E0B",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "600",
          },
        });
        setLoading((prev) => ({ ...prev, [actionType]: false }));
        return;
      }

      const response = await axios.post(
        "http://localhost:8989/api/doctors/ePrescription/addEPrescription",
        payload
      );

      toast.success(
        response.data?.message ||
          `${actionType.toUpperCase()} completed successfully!`,
        {
          icon:
            actionType === "prescribe" ? (
              <FaPills />
            ) : actionType === "followup" ? (
              <FaRedoAlt />
            ) : (
              <FaUserMd />
            ),
          style: {
            background:
              actionType === "prescribe"
                ? "#4F46E5"
                : actionType === "followup"
                ? "#059669"
                : "#DC2626",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: "600",
          },
        }
      );

      setForm((prev) => ({ ...prev, notes: "" }));
    } catch (error) {
      console.error(error);
      toast.error("❌ Failed to send data. Please try again.", {
        style: {
          background: "#B91C1C",
          color: "#fff",
          borderRadius: "12px",
        },
      });
    } finally {
      setLoading((prev) => ({ ...prev, [actionType]: false }));
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        transition={Slide}
      />

      <div className=" flex items-center justify-center bg-gradient-to-br p-4">
        <div className="bg-white shadow-2xl rounded-3xl w-full  p-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">
            🩺 E-Prescription
          </h1>
          <section>
            <label className="block text-gray-600 text-sm mb-1">
              Rx(Prescription Entry)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g., Atorvastatin 20mg, 1 tablet PO nightly. Take for 30 days."
              rows={4}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 bg-gray-50"
            />

            {/* Capture and Print Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button className="flex-1 border border-green-500 text-green-600 rounded-md py-2 hover:bg-green-50 transition">
                Capture from Device
              </button>
              <button className="flex-1 border border-gray-400 text-gray-600 rounded-md py-2 hover:bg-gray-100 transition">
                Print Prescription
              </button>
            </div>

            {/* Bottom Action Buttons */}
       
            <div className="flex flex-wrap gap-3 justify-between">
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
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default DoctEPrescription;
