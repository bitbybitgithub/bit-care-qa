import React from "react";
import { calculateAge, getNextFollowupDate } from "../../../utils/followup";

interface FollowUpDto {
  appointment_id: string;
  patient_id: number;
  patient_name: string;
  contact: string;
  dob: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string;
  start_time: string;
  end_time: string;
  status: string;
  source: string;
  created_by: string;
  created_date: string;
  modified_by: string;
  modified_date: string;
  gender: string | null;
  cancellation_reason: string | null;
  followup: boolean;
  duration: string | null;
}

interface FollowUpAppointmentProps {
  mode?: "doctor" | "staff";
  loading: boolean;
  doctorId?: number;
  classProp?: string;
  error?: string;
  data: any[];
}

const FollowUpAppointment: React.FC<FollowUpAppointmentProps> = ({
  mode = "staff",
  loading,
  doctorId,
  classProp = "",
  error,
  data = [],
}) => {
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "in_consultation":
        return "bg-purple-100 text-purple-700";
      case "checked_in":
        return "bg-green-200 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  return (
    <div
      className={`overflow-x-auto rounded-2xl shadow-sm border border-gray-200 ${classProp}`}
    >
      <table className="min-w-full">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left rounded-tl-2xl">Patient Name</th>
            <th className="px-6 py-3 text-left">Patient Contact No</th>
            <th className="px-6 py-3 text-left">Patient Age</th>
            <th className="px-6 py-3 text-left">Doctor Name</th>
            <th className="px-6 py-3 text-left">Appointment Date</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Source</th>

            <th className="px-6 py-3 text-left">Reason</th>
            <th className="px-6 py-3 text-left">Follow Up</th>
            <th className="px-6 py-3 text-left">Next Follow up Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.patient_name}
              className="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td className="px-6 py-3 font-medium text-gray-800">
                {item.patient_name}{" "}
                {item.gender && (
                  <span className="text-gray-500 text-sm ml-1">
                    ({item.gender.charAt(0).toUpperCase()})
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-gray-700">{item.contact}</td>
              <td className="px-6 py-3 text-gray-700">
                {calculateAge(item.dob)} years
              </td>

              <td className="px-6 py-3 text-gray-700">{item.doctor_name}</td>
              <td className="px-4 py-2">
                {new Date(item.appointment_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-3 text-gray-700">{item.source}</td>

              <td className="px-6 py-3 text-gray-700">{item.reason}</td>
              <td className="px-6 py-3 text-gray-700">
                {item.followup ? "yes" : "no"}
              </td>

              <td className="px-4 py-2">
                {getNextFollowupDate(item.appointment_date, item.duration)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FollowUpAppointment;
