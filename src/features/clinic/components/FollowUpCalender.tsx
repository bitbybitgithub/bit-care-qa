import React, { useState } from "react";
import { Button, MenuItem, TextField } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiSparklingLine,
} from "react-icons/ri";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { saveAppointment } from "../../../api";
import { AppointmentStatus } from "../../../context/constant/enum";
import { getSessionItem } from "../../../context/sessions/userSession";

interface Props {
  patient: any;
  onClose?: () => void;
  onSave?: (data: any) => void;
}

const FollowUpCalender: React.FC<Props> = ({ patient, onClose, onSave }) => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  const startOfMonth = currentMonth.startOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();

  const user = getSessionItem("user", "user_id");

  const isPrevDisabled =
    currentMonth.isSame(today, "month") ||
    currentMonth.isBefore(today, "month");

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  const days: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(currentMonth.date(i));

  const handleSelect = (date: dayjs.Dayjs) => {
    if (date.isBefore(today.startOf("day"))) {
      toast.error("Past date not allowed");
      return;
    }
    setSelectedDate(date);
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select follow-up date");
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000);

      const appointmentData = {
        patient_id: patient.patient_id,
        doctor_id: patient.raw?.doctor_id || 0,
        patient_name: patient.name,
        doctor_name: patient.doctor,
        gender: patient.gender,
        appointment_date: selectedDate.format("YYYY-MM-DD"),
        start_time: formatTime(now),
        end_time: formatTime(endTime),
        status: AppointmentStatus.Scheduled,
        source: "walk_in",
        reason: "Follow Up Visit",
        date_of_birth: patient.date_of_birth,
        mobile_number: patient.mobile_number,
        user_id: user,
      };

      await saveAppointment(appointmentData);
      toast.success("Patient Next Appointment saved successfully!");
      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create follow-up appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <div className="flex items-center justify-between p-2 px-4 rounded-[var(--radius-lg)] bg-[var(--color-primary)] sticky z-10 m-2">
        <div>
          <h2 className="text-[var(--color-surface-alt)] text-lg font-[var(--font-weight-medium)] flex items-center gap-2">
            <RiSparklingLine /> Set Patient Follow Up
          </h2>
          <p className="text-blue-100 text-sm">{patient?.name}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-primary)] hover:text-white p-2 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)]"
        >
          <MdClose size={22} />
        </button>
      </div>

      <div className="flex-1 py-2 px-5 space-y-3 overflow-y-auto">
        <div className="bg-[var(--color-surface-alt)]/80 backdrop-blur-lg rounded-3xl p-6 shadow-[var(--shadow-lg)] border border-white/40 transition hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <button
              disabled={isPrevDisabled}
              onClick={() =>
                !isPrevDisabled &&
                setCurrentMonth(currentMonth.subtract(1, "month"))
              }
              className={`
    h-10 w-10 rounded-full flex items-center justify-center
    text-white shadow-md transition-all duration-300 cursor-pointer
    ${isPrevDisabled
                  ? "bg-gray-300 cursor-not-allowed opacity-60"
                  : "hover:scale-110"
                }
  `}
              style={
                !isPrevDisabled
                  ? { background: "var(--color-primary-light)" }
                  : undefined
              }
            >
              <RiArrowLeftSLine size={20} />
            </button>

            <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <RiCalendarEventLine className="text-[var(--color-primary)]" />
              {currentMonth.format("MMMM YYYY")}
            </div>

            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              className="h-10 w-10 rounded-full bg-[var(--color-primary-light)] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs font-semibold text-center text-gray-400 mb-4">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {days.map((date, index) => {
              if (!date) return <div key={index}></div>;

              const isPast = date.isBefore(today.startOf("day"));
              const isSelected =
                selectedDate && date.isSame(selectedDate, "day");
              const isToday = date.isSame(today, "day");

              return (
                <button
                  key={index}
                  disabled={isPast}
                  onClick={() => handleSelect(date)}
                  className={`
                    h-11 w-11 rounded-full flex items-center justify-center cursor-pointer
                    text-sm font-medium
                    transition-all duration-300 
                    ${isPast
                      ? "text-gray-300 cursor-none"
                      : "hover:scale-110 hover:bg-[var(--color-primary)] hover:text-[var(--color-surface-alt)] "
                    }
                    ${isSelected
                      ? "bg-[var(--color-primary)] text-[var(--color-surface-alt)] scale-110 shadow-[var(--shadow-lg)]"
                      : "bg-blue-50"
                    }
                    ${!isSelected && isToday
                      ? "border-2 border-[var(--color-primary)]"
                      : ""
                    }
                  `}
                >
                  {date.date()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-t border-[var(--color-primary)] bg-[var(--color-bg)] sticky bottom-0">
        <Button variant="outlined" size="small" fullWidth onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          size="small"
          fullWidth
          disabled={loading}
          onClick={handleSubmit}
        >
          Save Follow Up
        </Button>
      </div>
    </div>
  );
};

export default FollowUpCalender;
