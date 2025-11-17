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
import { getSessionItem } from "../../context/sessions/userSession";

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
  allergies: string;
  current_medications: string;
}

interface PatientVitalsProps {
  patientName?: string;
  patientId: number;
  doctorId: number;
  // clinicId: number;
  appointmentId: number;
  onClose?: () => void;
  isOpen?: boolean;
  createdBy: string;
  onStatusUpdate?: () => void;
}

const VitalsComponents: React.FC<PatientVitalsProps> = memo(
  ({
    patientName = "Unknown Patient",
    onClose,
    patientId,
    doctorId,
    // clinicId,
    appointmentId,
    createdBy,
    onStatusUpdate,
  }) => {
    const clinicId = getSessionItem("user", "clinic_id");
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
      allergies: "",
      current_medications: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const { height_cm, weight_kg } = formData;
      if (height_cm > 0 && weight_kg > 0) {
        const bmi = Math.round((weight_kg / (height_cm / 100) ** 2) * 10) / 10;
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

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const payload = {
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_id: appointmentId,
          ...formData,
          created_by: createdBy,
          modified_by: createdBy,
          is_active: true,
        };

        await SavePatientVital(payload);
        console.log("Payload to be sent:", payload);
        toast.success("Vitals saved successfully!");
        try {
          onStatusUpdate?.();
        } catch (err) {
          console.error("onStatusUpdate callback failed:", err);
        }
        resetForm();
        onClose?.();
      } catch (error) {
        console.error("Error saving vitals:", error);
        toast.error("Failed to save vitals");
      } finally {
        setLoading(false);
      }
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
        allergies: "",
        current_medications: "",
      });
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

    const fields = [
      { field: "height_cm", label: "Height (cm)", placeholder: "170" },
      {
        field: "weight_kg",
        label: "Weight (kg)",
        placeholder: "70",
        icon: <FaWeightScale />,
      },
      { field: "bmi", label: "BMI", placeholder: "Auto" },
      {
        field: "temperature_c",
        label: "Temp (°C)",
        icon: <FaTemperatureLow />,
        placeholder: "36.5",
      },
      {
        field: "blood_pressure_systolic",
        label: "BP Sys",
        icon: <FaHeart />,
        placeholder: "120",
      },
      {
        field: "blood_pressure_diastolic",
        label: "BP Dia",
        icon: <FaHeart />,
        placeholder: "80",
      },
      {
        field: "pulse_rate",
        label: "Pulse",
        icon: <FaHeartPulse />,
        placeholder: "72",
      },
      {
        field: "respiration_rate",
        label: "Resp",
        icon: <FaWind />,
        placeholder: "16",
      },
      {
        field: "oxygen_saturation",
        label: "O₂ Sat (%)",
        icon: <FaWater />,
        placeholder: "98",
      },
    ];

    return (
      <div className="flex flex-col h-full rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 rounded-xl border-b-6 border-b-blue-950 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-1 z-10">
          <div>
            <h2 className="text-white text-lg font-bold flex items-center gap-2">
              <FaStethoscope className="text-white" /> Patient Vitals
            </h2>
            <p className="text-blue-100 text-sm">{patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 rounded-md hover:bg-blue-600"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {renderDivider("Vitals Info")}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(({ field, label, icon, placeholder }) => (
              <div key={field} className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1 uppercase">
                  {icon} {label}
                </label>
                <TextField
                  type="number"
                  placeholder={placeholder}
                  value={formData[field] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      field as keyof PatientVitalsData,
                      e.target.value
                    )
                  }
                  size="small"
                  fullWidth
                />
              </div>
            ))}
          </div>

          {renderDivider("Additional Info")}

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Chief Complaint
            </label>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Headache, Fever..."
              value={formData.chief_complaint}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  chief_complaint: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Additional Notes
            </label>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Any relevant clinical observations..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Allergies
            </label>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Penicillin,Peanuts,Latex,"
              value={formData.allergies}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, allergies: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase">
              Current Medications
            </label>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Folic Acid(Daily), Lisinopril (Daily),"
              value={formData.current_medications}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  current_medications: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200 bg-gray-50 sticky bottom-0 z-10">
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
  }
);

export default VitalsComponents;
