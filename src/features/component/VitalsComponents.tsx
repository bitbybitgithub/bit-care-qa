import React, { useState, useEffect, memo } from "react";
import { Button, TextField } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  FaHeart,
  FaWater,
  FaWind,
  FaWeightScale,
  FaStethoscope,
  FaHeartPulse,
  FaTemperatureLow,
} from "react-icons/fa6";
import { SavePatientVital } from "../../api/VitalsApi"; 
import { toast } from "react-toastify";

interface PatientVitalsData {
  height_cm: number;
  weight_kg: number;
  temperature_c: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  pulse_rate: number;
  respiration_rate: number;
  oxygen_saturation: number;
  bmi: number;
  notes: string;
  chief_complaint: string;
}

interface PatientVitalsProps {
  patientName?: string;
  patientId: number;
  doctorId: number;
  clinicId: number;
  appointmentId: number;
  onClose?: () => void;
  isOpen?: boolean;
  createdBy: string;
}

interface FieldConfig {
  field: keyof PatientVitalsData;
  label: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

const PatientVitals: React.FC<PatientVitalsProps> = memo(
  ({
    patientName = "Hira Thakur",
    onClose,
    isOpen,
    patientId,
    doctorId,
    clinicId,
    appointmentId,
    createdBy,
  }) => {
    const [formData, setFormData] = useState<PatientVitalsData>({
      height_cm: 0,
      weight_kg: 0,
      temperature_c: 36.5,
      blood_pressure_systolic: 0,
      blood_pressure_diastolic: 0,
      pulse_rate: 0,
      respiration_rate: 0,
      oxygen_saturation: 0,
      bmi: 0,
      notes: "",
      chief_complaint: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const { height_cm, weight_kg } = formData;
      if (height_cm > 0 && weight_kg > 0) {
        const bmi = Math.round((weight_kg / ((height_cm / 100) ** 2)) * 10) / 10;
        setFormData((prev) => ({ ...prev, bmi }));
      }
    }, [formData.height_cm, formData.weight_kg]);
    const handleInputChange = (
      field: keyof PatientVitalsData,
      value: string | number
    ) => {
      const numValue =
        typeof value === "string" ? Number.parseFloat(value) || 0 : value;
      setFormData((prev) => ({ ...prev, [field]: numValue }));
    };
    const handleChiefComplaint = (value: string) => {
      setFormData((prev) => ({ ...prev, chief_complaint: value }));
    };

    const handleAdditionalNote = (value: string) => {
      setFormData((prev) => ({ ...prev, notes: value }));
    };

    const resetForm = () => {
      setFormData({
        height_cm: 0,
        weight_kg: 0,
        temperature_c: 36.5,
        blood_pressure_systolic: 0,
        blood_pressure_diastolic: 0,
        pulse_rate: 0,
        respiration_rate: 0,
        oxygen_saturation: 0,
        bmi: 0,
        notes: "",
        chief_complaint: "",
      });
    };

    const handleSubmit = async () => {
        debugger;
      setLoading(true);
      try {
        const payload = {
          patient_id: 2,
          doctor_id: 2,
          clinic_id: 1,
          appointment_id: 45,
          ...formData,
          created_by: createdBy,
          modified_by: createdBy,
          is_active: true,
        };

        const response = await SavePatientVital(payload);
        console.log("Vitals saved successfully:", response.data);
        toast.success("Patient vitals saved successfully");
        resetForm();
        if (onClose) onClose();
      } catch (error) {
        console.error("Failed to save vitals:", error);
      } finally {
        setLoading(false);
      }
    };

    const renderDivider = (label: string) => (
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-blue-100" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className="flex-1 h-px bg-blue-100" />
      </div>
    );

    const measurements: FieldConfig[] = [
      { field: "height_cm", label: "Height (cm)", placeholder: "170" },
      {
        field: "weight_kg",
        label: "Weight (kg)",
        placeholder: "70",
        icon: <FaWeightScale className="w-3.5 h-3.5" />,
      },
      {field: "bmi", label: "BMI", placeholder: "Auto" },
    ];

    const vitals: FieldConfig[] = [
      {
        field: "temperature_c",
        label: "Temp (°C)",
        icon: <FaTemperatureLow className="w-3.5 h-3.5 text-red-500" />,
        placeholder: "36.5",
      },
      {
        field: "blood_pressure_systolic",
        label: "BP Sys",
        icon: <FaHeart className="w-3.5 h-3.5 text-red-600" />,
        placeholder: "120",
      },
      {
        field: "blood_pressure_diastolic",
        label: "BP Dia",
        icon: <FaHeart className="w-3.5 h-3.5 text-orange-500" />,
        placeholder: "80",
      },
      {
        field: "pulse_rate",
        label: "Pulse",
        icon: <FaHeartPulse className="w-3.5 h-3.5 text-pink-500" />,
        placeholder: "72",
      },
      {
        field: "respiration_rate",
        label: "Resp",
        icon: <FaWind className="w-3.5 h-3.5 text-cyan-500" />,
        placeholder: "16",
      },
      {
        field: "oxygen_saturation",
        label: "O₂ Sat (%)",
        icon: <FaWater className="w-3.5 h-3.5 text-blue-600" />,
        placeholder: "98",
      },
    ];

    const renderFields = (items: FieldConfig[]) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ field, label, placeholder, icon }) => (
          <div key={field} className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
              {icon}
              {label}
            </label>
            <TextField
              type="number"
              placeholder={placeholder}
              value={formData[field] || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              size="small"
              fullWidth
            />
          </div>
        ))}
      </div>
    );
    const isModal = typeof isOpen !== "undefined";
    const content = (
      <div
        className={`${
          isModal
            ? "bg-white rounded-xl shadow-2xl border border-blue-100 flex flex-col"
            : "p-6 max-w-4xl mx-auto"
        }`}
      >
        <div
          className={`flex items-center justify-between ${
            isModal
              ? "p-6 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700"
              : "pb-6"
          }`}
        >
          <div>
            <h2
              className={`flex items-center gap-2 font-bold ${
                isModal ? "text-2xl text-white" : "text-3xl text-gray-900"
              }`}
            >
              <FaStethoscope className="w-6 h-6" />
              Patient Vitals
            </h2>
            <p
              className={`text-sm ${
                isModal ? "text-blue-100" : "text-gray-600"
              } mt-1`}
            >
              {patientName}
            </p>
          </div>
          {isModal && (
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-2 hover:bg-blue-600 rounded-lg"
              aria-label="Close modal"
            >
              <MdClose className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className={`${isModal ? "p-6 overflow-y-auto space-y-6" : "space-y-8"}`}>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <FaHeartPulse className="w-4 h-4 text-blue-600" /> Chief Complaint
            </label>
            <TextField
              placeholder="e.g., Fever, Cough, Body pain..."
              value={formData.chief_complaint}
              onChange={(e) => handleChiefComplaint(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </div>

          {renderDivider("Measurements")}
          {renderFields(measurements)}

          {renderDivider("Vital Signs")}
          {renderFields(vitals)}

          {renderDivider("Notes")}
          <div className="space-y-3 pb-4">
            <label className="text-sm font-semibold text-gray-900">
              Additional Notes
            </label>
            <TextField
              placeholder="Any additional observations or clinical findings..."
              value={formData.notes}
              onChange={(e) => handleAdditionalNote(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </div>
        </div>

        <div
          className={`flex gap-3 ${
            isModal
              ? "p-6 border-t border-blue-100 bg-blue-50"
              : "pt-6 border-t mt-4"
          }`}
        >
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            onClick={onClose || (() => resetForm())}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : "Save Vitals"}
          </Button>
        </div>
      </div>
    );
    if (isModal && isOpen) {
      return (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {content}
          </div>
        </>
      );
    }

    if (!isModal) {
      return <div className="py-10">{content}</div>;
    }

    return null;
  }
);

export default PatientVitals;
