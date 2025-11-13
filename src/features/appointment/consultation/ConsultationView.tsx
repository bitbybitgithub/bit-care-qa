import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PatientHeader from "./PatientHeader";
import { Tabs, Tab, Button } from "@mui/material";
import type { ConsultationData } from "./types";
import PatientHistory from "./PatientHistory";
import type { ConsultationSummaryResponse } from "../../../types/appointmentTypes";
import axios from "axios";
import type { Patient } from "../../component/PatientQueue";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import DoctEPrescription from "./DoctEPrescription";
import SaveSOAPForm from "./SaveSOAPForm";
import SafetyContext from "../../../components/UI/SafetyContext";
import { AppointmentStatus } from "../../../context/constant/enum";


const fetchPatientInfo = async (
  patientId: number
): Promise<ConsultationSummaryResponse> => {
  const req = { patient_id: patientId };
  const res = await axios.post("http://localhost:8989/api/patients/info", req);
  return res.data;
};

interface ConsultationProps {
  patientInfo: Patient;
  onCloseDrawer: () => void;
}

const ConsultationView: React.FC<ConsultationProps> = ({
  patientInfo,
  onCloseDrawer,
}) => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [tab, setTab] = useState("consultation");
  const patientId = patientInfo?.raw?.patient_id;
  


  const { data, isLoading, error } = useQuery<ConsultationSummaryResponse>({
    queryKey: ["patientInfo", patientId],
    queryFn: async () => {
    if (!patientId) throw new Error("Missing patient ID");
    return fetchPatientInfo(patientId);
  },
    enabled: !!patientId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (error) console.error("Error fetching patient info:", error);
  }, [error]);

  const mappedPatient = patientInfo?.raw
    ? {
        patient_id: patientInfo.raw?.patient_id,
        patient_name: patientInfo.raw?.patient_name,
        date_of_birth: "1988-07-15", // ideally comes from another API if available
        gender: patientInfo?.raw?.gender === "Male" ? 1 : 2,
        age: 37,
        time: `${patientInfo?.raw?.start_time} - ${patientInfo?.raw.end_time}`,
        name: patientInfo?.raw?.patient_name,
        reason: patientInfo?.raw?.reason,
        status: patientInfo?.raw?.status,
        doctor: patientInfo?.raw?.doctor_name,
        appointmentDate: patientInfo?.raw?.appointment_date,
        source: patientInfo?.raw?.source,
      }
    : null;

  console.log({ data });
  console.log({ mappedPatient });
  console.log({ patientInfo });

const [status, setStatus] = useState<string | undefined>(
  patientInfo?.raw?.status ?? mappedPatient?.status
);

// keep status in sync when prop/derived mappedPatient changes
useEffect(() => {
  setStatus(patientInfo?.raw?.status ?? mappedPatient?.status);
}, [patientInfo?.raw?.status, mappedPatient?.status]);


  const calculateAge = (dob: string | number | Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header: Name + MRN + DOB */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500 p-6">
        {/* Patient Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mappedPatient?.patient_name}{" "}
              <span className="text-gray-500 font-normal text-sm">
                (MRN: {mappedPatient?.patient_id})
              </span>

               {/* Status pill */}
  {status && (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
        ${status === AppointmentStatus.InProgress ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}
    >
      {status === AppointmentStatus.InProgress ? "In Progress" : status}
    </span>
  )}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              DOB:{" "}
              {mappedPatient?.date_of_birth
                ? new Date(mappedPatient.date_of_birth).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }
                  )
                : "-"}{" "}
              ({calculateAge(mappedPatient?.date_of_birth)} y/o)
              {mappedPatient?.time && (
                <span className="ml-2">| Next Appt: {mappedPatient.time}</span>
              )}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onCloseDrawer}
            className="mt-3 sm:mt-0 text-gray-500 hover:text-gray-700 transition p-2 rounded-full hover:bg-gray-100"
            aria-label="Close consultation view"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* ✅ Two-column layout starts here */}
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* LEFT: Safety Context */}
          {data?.PatientvitalsDetails && (
            <div className="w-full lg:w-1/3">

              <SafetyContext
                allergies={data.PatientvitalsDetails.allergies || ""}
                current_medications={
                  data.PatientvitalsDetails.current_medications || ""
                }
              />
            </div>
          )}

          {/* RIGHT: Consultation & History */}
          <div className="w-full lg:w-2/3 space-y-6">
            {data?.PatientvitalsDetails && (
              <PatientHeader vitals={data.PatientvitalsDetails} />
            )}

            {/* Tabs Section */}
            <div className="w-full p-6 bg-[var(--color-white)] rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Consultation & Diagnosis (SOAP)
              </h2>
              <Tabs
                value={tab}
                onChange={(e, val) => setTab(val)}
                textColor="secondary"
                indicatorColor="secondary"
              >
                <Tab value="prescription" label="Prescription" />
                <Tab value="consultation" label="Consultation SOAP" />
              </Tabs>

              {tab === "consultation" && (
                <SaveSOAPForm
                  patientId={patientId}
                  appointment_id={patientInfo?.appointment_id}
                />
              )}
              {tab === "prescription" && <DoctEPrescription />}

              <div className="flex gap-3 mt-3">
                <Button variant="contained" color="primary">
                  Dispense Medication
                </Button>
                <Button variant="outlined">Refer To</Button>
                <Button variant="contained" color="warning">
                  Set Follow-up
                </Button>
                <Button variant="contained" color="success">
                  Complete
                </Button>
              </div>
            </div>

            {data && (
              <PatientHistory
                patientAppointmentHistory={data?.patientAppointmentHistory}
                patientId={patientId}
              />
            )}
          </div>
        </div>
        
      </div>
    </div>
  );

};

export default ConsultationView;
