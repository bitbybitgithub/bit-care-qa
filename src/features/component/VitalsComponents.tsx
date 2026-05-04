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
import {
  GetPatientVital,
  SavePatientVital,
  type PatientVitalsData,
  type PatientVitalsProps,
  type SavePatientVitalRequest,
} from "../../api/VitalsApi";
import { toast } from "react-toastify";
import { getSessionItem } from "../../context/sessions/userSession";
import { GiBodyHeight } from "react-icons/gi";
import { IoBody } from "react-icons/io5";
import { useSocket } from "../../context/SocketContext";

const VitalsComponents: React.FC<PatientVitalsProps> = memo(
  ({
    patientName = "Unknown Patient",
    onClose,
    patientId,
    doctorId,
    patientStatus,
    appointmentId,
    onStatusUpdate,
  }) => {
    const { socket } = useSocket();
    const clinicId = getSessionItem("user", "clinic_id");
    const userId = getSessionItem("user", "user_id");
    const [formData, setFormData] = useState<PatientVitalsData>({
      height_cm: 0,
      weight_kg: 0,
      temperature_c: 0,
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
    type VitalField = keyof PatientVitalsData;
    const [errors, setErrors] = useState<Partial<Record<VitalField, string>>>(
      {},
    );

    useEffect(() => {
      if (!socket) return;

      const fetchVitals = async () => {
        if (patientStatus === "on_hold") {
          try {
            const payload = { patient_id: patientId };
            const response = await GetPatientVital(payload);
            const vitals = response?.data?.[0];
            if (vitals) {
              setFormData((prev) => ({
                ...prev,
                height_cm: Number(vitals.height_cm) || 0,
                weight_kg: Number(vitals.weight_kg) || 0,
                temperature_c: Number(vitals.temperature_c) || 0,
                blood_pressure_systolic: vitals.blood_pressure_systolic || 0,
                blood_pressure_diastolic: vitals.blood_pressure_diastolic || 0,
                pulse_rate: vitals.pulse_rate || 0,
                respiration_rate: vitals.respiration_rate || 0,
                oxygen_saturation: Number(vitals.oxygen_saturation) || 0,
                bmi: Number(vitals.bmi) || 0,
                notes: vitals.notes || "",
                chief_complaint: vitals.chief_complaint || "",
                allergies: vitals.allergies || "",
                current_medications: vitals.current_medications || "",
              }));
            }
          } catch (error) {
            console.error("Error fetching vitals:", error);
          }
        }
      };
      fetchVitals();
    }, [socket, patientStatus, patientId]);

    useEffect(() => {
      const height = Number(formData.height_cm);
      const weight = Number(formData.weight_kg);

      if (height > 0 && weight > 0) {
        const bmi = Math.round((weight / (height / 100) ** 2) * 10) / 10;

        setFormData((prev) => ({ ...prev, bmi }));
      }
    }, [formData.height_cm, formData.weight_kg]);

    const handleInputChange = (
      field: keyof PatientVitalsData,
      value: string | number,
    ) => {
      let val = String(value);
      val = val.replace(/[^0-9]/g, "");
      if (val.length > 3) return;
      const numValue = val === "" ? 0 : isNaN(Number(val)) ? 0 : Number(val);
      setFormData((prev) => ({
        ...prev,
        [field]: numValue,
      }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    };

    const handleSubmit = async () => {
      setLoading(true);
      try {
        const payload: SavePatientVitalRequest = {
          ...formData,
          patient_id: patientId,
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_id: appointmentId,
          created_by: userId,
          modified_by: userId,
          is_active: true,
          user_id: userId,
        };
        await SavePatientVital(payload);
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
        temperature_c: 0,
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
      setErrors({});
    };

    const renderDivider = (label: string) => (
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-[var(--color-primary)]" />
        <span className="text-xs font-semibold text-[var(--color-text)]uppercase tracking-wide">
          {label}
        </span>
        <div className="flex-1 h-px bg-[var(--color-primary)]" />
      </div>
    );

    const fields = [
      {
        field: "height_cm",
        label: "Height (cm)",
        placeholder: "55-272",
        icon: <GiBodyHeight />,
      },
      {
        field: "weight_kg",
        label: "Weight (kg)",
        placeholder: "0-150",
        icon: <FaWeightScale />,
      },
      { field: "bmi", label: "BMI", placeholder: "Auto", icon: <IoBody /> },
      {
        field: "temperature_c",
        label: "Temp (°C)",
        icon: <FaTemperatureLow />,
        placeholder: "36.1 - 40.0",
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
      <div className="flex flex-col h-full rounded-[var(--radius-lg)] bg-[var(--color-surface)]  ">
        <div className="flex items-center justify-between p-2 px-4 rounded-[var(--radius-lg)] bg-[var(--color-primary)] sticky z-10 m-2">
          <div>
            <h2 className="text-[var(--color-surface-alt)] text-lg font-[var(--font-weight-medium)] flex items-center gap-2">
              <FaStethoscope /> Patient Vitals
            </h2>
            <p className="text-blue-100 text-sm">{patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-primary)] hover:text-white p-2 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)]"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 ">
          {renderDivider("Vitals Info")}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(({ field, label, icon, placeholder }) => (
              <div key={field} className="space-y-2">
                <label className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1 uppercase">
                  {icon} {label}
                </label>
                <TextField
                  type="text"
                  placeholder={placeholder}
                  value={formData[field] === 0 ? "" : formData[field]}
                  onChange={(e) =>
                    handleInputChange(
                      field as keyof PatientVitalsData,
                      e.target.value,
                    )
                  }
                  size="small"
                  fullWidth
                  error={Boolean(errors[field as VitalField])}
                />
              </div>
            ))}
          </div>

          {renderDivider("Additional Info")}

          <div>
            <label className="text-xs font-semibold uppercase">
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
              error={Boolean(errors.chief_complaint)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold  uppercase">
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
              error={Boolean(errors.notes)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase">Allergies</label>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Penicillin,Peanuts,Latex,"
              value={formData.allergies}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, allergies: e.target.value }))
              }
              error={Boolean(errors.allergies)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase">
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
              error={Boolean(errors.current_medications)}
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-[var(--color-primary)] bg-[var(--color-bg)] sticky bottom-0 z-10">
          <Button
            variant="outlined"
            color="inherit"
            fullWidth
            className="text-[var(--color-primary)] hover:text-white p-2 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)]"
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
  },
);

export default VitalsComponents;
