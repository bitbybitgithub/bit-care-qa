import React, { useState } from "react";
import { Tabs, Tab } from "@mui/material";
import type { PatientAppointmentHistory } from "../../../types/appointmentTypes";

// Mock for Vitals and Reports for demo
interface VitalLog {
  date: string;
  bp: string;
  temp: string;
  pulse: string;
}
interface Report {
  title: string;
  subtitle: string;
  pdfUrl: string;
}

interface Props {
  patientId: number;
  patientAppointmentHistory: PatientAppointmentHistory[];
}

const PatientHistory: React.FC<Props> = ({
  patientId,
  patientAppointmentHistory,
}) => {
  const [tab, setTab] = useState("history");

  // Mock vitals logs
  const vitalsLogs: VitalLog[] = [
    { date: "05/10/2025", bp: "118/76", temp: "99.1°F", pulse: "80 bpm" },
    { date: "12/08/2025", bp: "130/85", temp: "101.2°F", pulse: "95 bpm" },
  ];

  // Mock reports
  const reports: Report[] = [
    {
      title: "CBC & CRP - 05/10/2025",
      subtitle: "CRP mildly elevated (15 mg/L)",
      pdfUrl: "#",
    },
    {
      title: "Liver Function Test - 01/09/2025",
      subtitle: "All values within normal range",
      pdfUrl: "#",
    },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm mt-6 ">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Patient History</h2>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        textColor="secondary"
        indicatorColor="secondary"
      >
        <Tab
          value="history"
          label={`Consultations & Prescriptions (${patientAppointmentHistory?.length})`}
        />
        <Tab value="vitals" label="Vitals Logs" />
        <Tab value="reports" label={`Reports (${reports.length})`} />
      </Tabs>

      <div className="mt-4 max-h-64 overflow-y-auto">
        {/* Consultations & Prescriptions */}
        {tab === "history" && (
          <div className="space-y-4">
            {patientAppointmentHistory?.length > 0 ? (
              patientAppointmentHistory?.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {new Date(item.appointment_date).toLocaleDateString("en-GB")}{" "}
                    Consultation <span className="text-gray-500">| Dr. A. Smith</span>
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium text-gray-700">Summary:</span>{" "}
                    {item.consultation_notes || "No notes available"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Diagnosis:</span>{" "}
                    {item.diagnosis || "N/A"}
                  </p>

                  {item.prescription && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">
                        Prescription for{" "}
                        {new Date(item.appointment_date).toLocaleDateString("en-GB")}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {item.prescription}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm mt-2">
                No consultation history available.
              </p>
            )}
          </div>
        )}

        

        {/* Vitals Logs */}
        {tab === "vitals" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {vitalsLogs.map((vital, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <p className="font-semibold text-gray-900">
                  Date: {vital.date}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  BP: {vital.bp} | Temp: {vital.temp} | Pulse: {vital.pulse}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Reports */}
        {tab === "reports" && (
          <div className="space-y-3 mt-3">
            {reports.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {r.title}
                  </p>
                  <p className="text-sm text-gray-600">{r.subtitle}</p>
                </div>
                <button className="text-green-600 font-medium hover:underline text-sm">
                  View PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
