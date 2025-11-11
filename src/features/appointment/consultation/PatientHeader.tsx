import React from "react";
import type {  PatientVitalsDetails } from "../../../types/appointmentTypes";

interface Props {
  vitals: PatientVitalsDetails;
}

const PatientHeader: React.FC<Props> = ({  vitals }) => {

  const bloodPressure = `${vitals?.blood_pressure_systolic}/${vitals?.blood_pressure_diastolic}`;
  const temperatureF = (parseFloat(vitals?.temperature_c) * 9) / 5 + 32;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        <VitalCard label="BP" value={bloodPressure} unit="mmHg" />
        <VitalCard label="Pulse" value={vitals?.pulse_rate} unit="bpm" />
        <VitalCard
          label="Temp"
          value={temperatureF.toFixed(1)}
          unit="°F"
        />
        <VitalCard
          label="SpO₂"
          value={vitals?.oxygen_saturation}
          unit="%"
        />
        <VitalCard
          label="Weight"
          value={vitals?.weight_kg}
          unit="kg"
        />
        <VitalCard
          label="BMI"
          value={vitals?.bmi}
        />
      </div>
    </div>
  );
};

// ✅ Reusable Vital Card
interface VitalProps {
  label: string;
  value: string | number;
  unit?: string;
}

const VitalCard: React.FC<VitalProps> = ({ label, value, unit }) => (
  <div className="rounded-lg border border-gray-200 p-3 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
    <p className="text-xs uppercase text-gray-500 font-medium">{label}</p>
    <p className="text-lg font-semibold text-gray-900">
      {value}
      {unit && <span className="text-sm text-gray-600 font-normal"> {unit}</span>}
    </p>
  </div>
);

export default PatientHeader;
