import React, { useEffect, useState } from "react";
import {
  FileText,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Info,
  X,
} from "lucide-react";
import type { DockItem } from "../../../components/UI/Dock/DockIcon";
import Dock from "../../../components/UI/Dock/Dock";
import ConsultationSummary from "./ConsultationSummary";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import PatientHistory from "./PatientHistory";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import type { ConsultationSummaryResponse } from "../../../types/appointmentTypes";

// 📘 Sample Tab Components
const DocumentationView = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
      Documentation
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Record patient consultation notes, prescriptions, and summary.
    </p>
  </div>
);

const HistoryView = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
      Patient History
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      View and update patient's previous visit and treatment details.
    </p>
  </div>
);

const ResultsView = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
      Results & Labs
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Access diagnostic reports and lab test results.
    </p>
  </div>
);

const VitalsView = () => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
      Vitals Log
    </h2>
    <p className="text-gray-600 dark:text-gray-400">
      Monitor and update patient's vital signs (BP, Temp, RR, SpO₂).
    </p>
  </div>
);

const sampleData = {
  name: "John M. Davis",
  gender: "M",
  age: 35,
  status: "In Consultation",
  vitals: {
    bp: "128/84",
    temperature: "36.7",
    rr: "16",
    spo2: "97%",
  },
  chiefComplaint: "Flu-like symptoms persisting for 7 days (fever, body aches).",
  triageNotes: "Patient rated pain at 5/10. Needs detailed assessment.",
};




const fetchPatientInfo = async (
  patientId: number
): Promise<ConsultationSummaryResponse> => {
  const req = { patient_id: patientId };
  const res = await axios.post(
    "http://localhost:8989/api/patients/info",
    req
  );
  return res.data;
};
interface ConsultationProps {
  patientInfo: Patient;
  onCloseDrawer: () => void;
}



const ConsultationView: React.FC<ConsultationProps> = ({ patientInfo, onCloseDrawer }) => {

  const [patientData, setPatientData] = useState<ConsultationSummaryResponse>();
  const patientId = patientInfo?.raw?.patient_id;
  const { data } = useQuery<ConsultationSummaryResponse>({
    queryKey: ["patientInfo", patientId],//patientInfo?.raw?.patient_id],
    queryFn: () => fetchPatientInfo(patientId),//patientInfo?.raw?.patient_id),
    enabled: !!patientId, // Only run if clinicId is available
    staleTime: Infinity, // Treat the data as fresh after fetch
  });

  useEffect(() => {
    if (data) {
      setPatientData(data);
    }
  }, [data]);

  console.log({ patientInfo })
  console.log({ data })

  const appDockItems: DockItem[] = [
    { key: "summary", icon: Info, label: "Summary", component: <ConsultationSummary 
      data={patientData?.PatientvitalsDetails} info={patientInfo} /> },
    { key: "documentation", icon: FileText, label: "Documentation", component: <DocumentationView /> },
    { key: "history", icon: ClipboardList, label: "History", component: 
    <PatientHistory patientAppointmentHistory={patientData?.patientAppointmentHistory} /> },
    { key: "results", icon: FlaskConical, label: "Results & Labs", component: <ResultsView /> },
    { key: "vitals", icon: HeartPulse, label: "Vitals Log", component: <VitalsView /> },
  ];

  return (
    <div className="relative h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Close button pinned at top-right */}
      <button
        onClick={onCloseDrawer}
        className="absolute right-4 top-4 z-50 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition"
      >
        <X size={22} />
      </button>

      <div className="flex-1 overflow-auto">
        <Dock items={appDockItems} initialKey="summary" />
      </div>
    </div>
  )

  // <Dock items={appDockItems} initialKey="summary" />;
};

export default ConsultationView;


