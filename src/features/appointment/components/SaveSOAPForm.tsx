import React, { useState } from "react";
import type { SaveSOAPRequest } from "../../../types/soap";
import { saveSOAPDetails } from "../../../api/soapService";
import { getSessionItem } from "../../../context/sessions/userSession";

interface SaveSOAPProps {
  patient_id: number;
  appointment_id: number;
}

const SaveSOAPForm: React.FC<SaveSOAPProps> = ({
  patient_id,
  appointment_id,
}) => {
  const clinicId = getSessionItem("user", "clinic_id");
  const userId = getSessionItem("user", "user_id");
  const [form, setForm] = useState<SaveSOAPRequest>({
    clinic_id: clinicId,
    patient_id: patient_id,
    appointment_id: appointment_id,
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    created_by: userId,
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg(null);

    const response = await saveSOAPDetails(form);
    setResponseMsg(response.message);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[var(--color-white)]  rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Consultation & Diagnosis (SOAP)
      </h2>

      <hr className="mb-6 border-gray-300" />

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-2 ">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Subjective (HPI, ROS, Complaints)
          </label>
          <textarea
            name="subjective"
            placeholder="Patient reports headache starting 3 days ago..."
            value={form.subjective}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Objective (Exam Findings & Current Vitals)
          </label>
          <textarea
            name="objective"
            placeholder="Physical exam WNL except for mild tenderness in neck..."
            value={form.objective}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Assessment / ICD-10 Code
          </label>
          <textarea
            name="assessment"
            placeholder="Migraine without aura (G43.009)"
            value={form.assessment}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Plan (Follow-up, Next Steps, Labs)
          </label>
          <textarea
            name="plan"
            placeholder="Continue current therapy. RTC in 2 weeks or sooner..."
            value={form.plan}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-300 text-gray-800 p-3 rounded-lg shadow-sm transition-all duration-200 placeholder:text-gray-400 outline-none"
            rows={3}
            l
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-sm ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-800 hover:bg-gray-900 active:scale-[0.98]"
          }`}
        >
          {loading ? "Saving..." : "Save SOAP"}
        </button>
      </form>

      {responseMsg && (
        <div
          className={`mt-4 text-center font-semibold ${
            responseMsg.includes("exists") ? "text-red-600" : "text-green-600"
          }`}
        >
          {responseMsg}
        </div>
      )}
    </div>
  );
};

export default SaveSOAPForm;
