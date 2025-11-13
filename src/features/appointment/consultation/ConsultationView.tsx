import React, { useEffect, useMemo, useState } from "react";
import { Tabs, Tab, Button } from "@mui/material";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PatientHeader from "./PatientHeader";
import PatientHistory from "./PatientHistory";
import SaveSOAPForm from "./SaveSOAPForm";
import DoctEPrescription from "./DoctEPrescription";
import type { Patient } from "../../component/PatientQueue";
import type { ConsultationSummaryResponse } from "../../../types/appointmentTypes";
import { toast } from "react-toastify";
import type { SaveSOAPRequest } from "../../../types/soap";
import { getSessionItem } from "../../../context/sessions/userSession";
import { saveSOAPDetails } from "../../../api/soapService";
import SafetyContext from "../../../components/UI/SafetyContext";
import { AppointmentStatus } from "../../../context/constant/enum";


const fetchPatientInfo = async (
  patientId: number
): Promise<ConsultationSummaryResponse> => {
  const res = await axios.post("http://localhost:8989/api/patients/info", {
    patient_id: patientId,
  });
  return res.data;
};

interface ConsultationProps {
  patientInfo: Patient;
  onCloseDrawer: () => void;
  isDrawer : boolean;
}

const ConsultationView: React.FC<ConsultationProps> = ({
  patientInfo,
  onCloseDrawer,
  isDrawer = true,
}) => {
  const [tab, setTab] = useState("prescription");
  const patientId = patientInfo?.raw?.patient_id;
  const [data, setData] = useState<ConsultationSummaryResponse | null>(null);
  
  const clinicId = getSessionItem("user", "clinic_id");
    const userId = getSessionItem("user", "user_id");
  
  const [soapForm, setSoapForm] = useState<SaveSOAPRequest>({
    clinic_id: clinicId,
    patient_id: patientInfo?.raw.patient_id,
    appointment_id: patientInfo?.appointment_id,
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    created_by: userId,
   });

   const [prescriptionPayload, setPrescriptionPayload] = useState({
    patient_id: Number(patientInfo?.raw.patient_id),
    doctor_id: 4,
    clinic_id: clinicId,
    appointment_date: patientInfo?.raw.appointment_date,
    appointment_status: "Complete",
    consultation_notes: null,
    diagnosis: patientInfo?.raw.reason,
    prescription: "",
    appointment_id:  Number(patientInfo?.appointment_id),
    created_by: userId.toString(),
   });

  // const { data, error } = useQuery<ConsultationSummaryResponse>({
  //   queryKey: ["patientInfo", patientId],
  //   queryFn: () => fetchPatientInfo(patientId),
  //   enabled: !!patientId,
  //   staleTime: 1000 * 60 * 10, // cache 10 minutes
  // });

  useEffect(() => {
    if (!patientId) return;

    const getPatientInfo = async () => {
      try {
        const fetchedData = await fetchPatientInfo(patientId);
        console.log({ fetchedData });
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching patient info:", error);
      }
    };

    getPatientInfo();
  }, [patientId]);

  // Memoized derived data
  const mappedPatient = useMemo(() => {
    if (!patientInfo?.raw) return null;
    return {
      patient_id: patientInfo.raw.patient_id,
      patient_name: patientInfo.raw.patient_name,
      date_of_birth: "1988-07-15", // replace with actual if available
      gender: patientInfo.raw.gender === "Male" ? 1 : 2,
      age: 37,
      time: `${patientInfo.raw.start_time} - ${patientInfo.raw.end_time}`,
      reason: patientInfo.raw.reason,
      status: patientInfo.raw.status,
      doctor: patientInfo.raw.doctor_name,
      appointmentDate: patientInfo.raw.appointment_date,
      source: patientInfo.raw.source,
    };
  }, [patientInfo]);
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
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  console.log({ data }); 
  console.log({ patientInfo }); 
  console.log({ soapForm }); 
  console.log({ prescriptionPayload }); 


  // Prescription
  const handlePrescriptionChange = (val : any) => { 
    setPrescriptionPayload((prev) => ({ ...prev, prescription: val }));
  }
  const savePrescription = async () => {
       await axios.post(
        "http://localhost:8989/api/doctors/ePrescription/addEPrescription",
        prescriptionPayload
      ).then(res => toast.success("Prescription saved successfully"));
  }

  // SOAP form

  const handleSoapDetails = (name: any, value: any) => { 
    setSoapForm((prev) => ({ ...prev, [name]: value }));
  }
  const saveSOAP = async () => {
   await saveSOAPDetails(soapForm);
  }

  const handleDispenseMedication = () => {
    if (tab == 'prescription') {
      savePrescription();
    } else if (tab == 'consultation') {
      saveSOAP();
    }
  }

return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500 p-6">
        {/* Patient Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mappedPatient?.patient_name}
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
                    "en-GB"
                  )
                : "-"}{" "}
              ({calculateAge(mappedPatient?.date_of_birth)} y/o)
              {mappedPatient?.time && (
                <span className="ml-2">| Next Appt: {mappedPatient.time}</span>
              )}
            </p>
          </div>

          { isDrawer && <button
            onClick={onCloseDrawer}
            className="mt-3 sm:mt-0 text-gray-500 hover:text-gray-700 transition p-2 rounded-full hover:bg-gray-100"
            aria-label="Close consultation view"
          >
            <X size={22} strokeWidth={2} />
          </button>}
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
              form={soapForm}
              handleSoapDetails={handleSoapDetails}
            />
          )}
          {tab === "prescription" && <DoctEPrescription form={prescriptionPayload} handlePrescriptionChange={handlePrescriptionChange}/>}

          <div className="flex gap-3 mt-3">
            <Button variant="contained" color="primary" onClick={handleDispenseMedication}>
              Dispense Medication
            </Button>
            <Button variant="outlined" onClick={()=> toast.info("Refer Module is Not Available at the moment!!!")}>Refer To</Button>
            <Button onClick={()=> toast.info("Follow-Up Module is Not Available at the moment!!!")} variant="contained" color="warning">
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
