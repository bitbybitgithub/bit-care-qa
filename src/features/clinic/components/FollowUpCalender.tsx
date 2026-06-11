import React, { useEffect, useState } from "react";
import { Button, CircularProgress, TextField } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiSparklingLine,
} from "react-icons/ri";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  getAppointmentSlots,
  getfollowupData,
  saveAppointment,
  updateFollowUp,
  type AppointmentSlot,
} from "../../../api";
import { AppointmentStatus } from "../../../context/constant/enum";
import { getSessionItem } from "../../../context/sessions/userSession";
import { formatDateDDMMYYYY } from "../../../utils/DateUtils";
interface Props {
  patient: any;
  onClose?: () => void;
  onSave?: (data: any) => void;
}

const FollowUpCalender: React.FC<Props> = ({ patient, onClose }) => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUpReason, setFollowUpReason] = useState("");

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<any>(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const userId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const startOfMonth = currentMonth.startOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();

  const [slotsLoading, setSlotsLoading] = useState(false);
  const formatDate = (d: string) => dayjs(d).format("YYYY-MM-DD");
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null,
  );
  const [doctorSlots, setDoctorSlots] = useState<AppointmentSlot[]>([]);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        if (!patient?.appointment_id || !patient?.patient_id) return;

        const res = await getfollowupData(
          Number(patient.appointment_id),
          Number(patient.patient_id),
          Number(clinicId),
        );
        const data = (res || []).map((f: any) => ({
          ...f,
          appointment_id: Number(f.new_appointment_id),
          patient_id: Number(f.patient_id),
        }));
        setFollowUps(data);
      } catch (error) {
        console.error("Failed to fetch followups", error);
      }
    };

    fetchFollowups();
  }, [patient]);

  const hasFollowUp = followUps.some((f) => f.is_follow_up == "1");

  const futureFollowUps = followUps
    .filter((f) => dayjs(f.follow_up_date).isAfter(dayjs().startOf("day")))
    .sort((a, b) => dayjs(a.follow_up_date).diff(dayjs(b.follow_up_date)));
  const nextFollowUp = futureFollowUps[0];

  const existingFollowUp = followUps.find((f) => f.is_follow_up === "1");
  const isPrevDisabled =
    currentMonth.isSame(today, "month") ||
    currentMonth.isBefore(today, "month");

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  const days: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(currentMonth.date(i));

  const handleSelect = async (date: dayjs.Dayjs) => {
  if (date.isBefore(today.startOf("day"))) {
    toast.error("Past date not allowed");
    return;
  }
  setSelectedDate(date);
  setSelectedSlot(null);
  const selected = followUps.find(
    (f) => formatDate(f.follow_up_date) === date.format("YYYY-MM-DD")
  );
  if (selected) {
    setFollowUpReason(selected.follow_up_reason);
    setSelectedFollowUp(selected);
    setIsUpdateMode(true);
  } else {
    setFollowUpReason("");
    setSelectedFollowUp(null);
    setIsUpdateMode(false);
  }
  try {
    setSlotsLoading(true);

    const res = await getAppointmentSlots({
      doctorId: Number(patient.raw?.doctor_id),
      clinicId: Number(clinicId),
      date: date.format("YYYY-MM-DD"),
    });

    if (res.success) {
      const availableSlots = res.slots.filter(
        (slot) => slot.status === "AVAILABLE"
      );

      setDoctorSlots(availableSlots);
      if (
        selected &&
        selected.start_time &&
        selected.end_time
      ) {
        const existingSlot = availableSlots.find(
          (slot) =>
            slot.start === selected.start_time.substring(0, 5) &&
            slot.end === selected.end_time.substring(0, 5)
        );

        if (existingSlot) {
          setSelectedSlot(existingSlot);
        }
      }
    } else {
      setDoctorSlots([]);
    }
  } catch (error) {
    console.error("Failed to fetch slots", error);
    setDoctorSlots([]);
  } finally {
    setSlotsLoading(false);
  }
};

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select follow-up date");
      return;
    }
    if (!followUpReason.trim()) {
      toast.error("Please enter reason for follow up");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a slot");
      return;
    }
    setLoading(true);
    try {
      if (isUpdateMode && selectedFollowUp) {
        await updateFollowUp({
          appointment_id: selectedFollowUp.new_appointment_id,
          follow_up_date: selectedDate.format("YYYY-MM-DD"),
          follow_up_reason: followUpReason,
          clinic_id: clinicId,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          modified_by: userId,
        });

        toast.success("Follow-up updated successfully");
      } else {
        const now = new Date();
        const endTime = new Date(now.getTime() + 30 * 60000);

        const appointmentData = {
          patient_id: patient.patient_id,
          doctor_id: patient.raw?.doctor_id || 0,
          clinic_id: clinicId,
          patient_name: patient.name,
          doctor_name: patient.doctor,
          gender: patient.gender,
          appointment_date: selectedDate.format("YYYY-MM-DD"),
          start_time: formatTime(now),
          end_time: formatTime(endTime),
          status: AppointmentStatus.Scheduled,
          source: "web",
          reason: followUpReason,
          date_of_birth: patient.date_of_birth,
          mobile_number: patient.mobile_number,
          user_id: userId,
          follow_up_id: patient.appointment_id,
          is_follow_up: true,
        };

        await saveAppointment(appointmentData);
        toast.success("Follow-up created successfully");
      }

      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save follow-up");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpUpdate = async () => {
    setLoading(true);
    if (!selectedDate) {
      toast.error("Please select follow-up date");
      return;
    }
    if (!followUpReason.trim()) {
      toast.error("Please enter reason for follow up");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a slot");
      return;
    }
    if (!existingFollowUp) {
      toast.error("No follow-up available to update");
      return;
    }
    const existingDate = dayjs(existingFollowUp.follow_up_date).format(
      "YYYY-MM-DD",
    );
    const newDate = selectedDate.format("YYYY-MM-DD");

      const existingStart = existingFollowUp.start_time?.substring(0, 5);

      const isSameDate = existingDate === newDate;
      const isSameSlot = existingStart === selectedSlot.start;

      if (isSameDate && isSameSlot) {
        toast.error("No changes detected");
        return;
      }
    try {
      await updateFollowUp({
        appointment_id: existingFollowUp.new_appointment_id,
        follow_up_date: newDate,
        follow_up_reason: followUpReason,
        modified_by: userId,
        clinic_id: clinicId,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      });

      toast.success("Appointment updated successfully");
      onClose?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update follow-up");
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

      {nextFollowUp && (
        <div className="text-sm text-red-600 mt-3 font-medium text-center">
          Your next scheduled appointment is on{" "}
          {formatDateDDMMYYYY(nextFollowUp.follow_up_date)}
        </div>
      )}
      <div className="flex-1 py-2 px-5 space-y-3 overflow-y-auto">
        <div className="bg-[var(--color-surface-alt)]/80 backdrop-blur-lg rounded-3xl p-6 shadow-[var(--shadow-lg)] border border-white/40">
          <div className="flex items-center justify-between mb-6">
            <button
              disabled={isPrevDisabled}
              onClick={() =>
                !isPrevDisabled &&
                setCurrentMonth(currentMonth.subtract(1, "month"))
              }
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                isPrevDisabled ? "bg-gray-300" : ""
              }`}
            >
              <RiArrowLeftSLine size={20} />
            </button>

            <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <RiCalendarEventLine />
              {currentMonth.format("MMMM YYYY")}
            </div>

            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              className="h-10 w-10 rounded-full"
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

              const followUpData = followUps.find(
                (f) =>
                  formatDate(f.follow_up_date) === date.format("YYYY-MM-DD"),
              );

              const hasFollowUp = !!followUpData;

              return (
                <button
                  key={index}
                  disabled={isPast}
                  onClick={() => handleSelect(date)}
                  title={followUpData?.follow_up_reason || ""}
                  className={`
                    h-11 w-11 rounded-full flex items-center justify-center cursor-pointer
                    text-sm font-medium transition-all duration-300
                    ${
                      isPast
                        ? "text-gray-300 cursor-none"
                        : "hover:scale-110 hover:bg-[var(--color-primary)] hover:text-[var(--color-surface-alt)] "
                    }
                    ${hasFollowUp ? "bg-red-500 text-white" : "bg-blue-50"}
                    ${isSelected ? "ring-2 ring-blue-600" : ""}
                  `}
                >
                  {date.date()}
                </button>
              );
            })}
          </div>
        </div>
        {selectedDate && (
          <div className="bg-white rounded-[var(--radius-lg)] p-4 shadow-sm border">
            <h3 className="font-semibold mb-3 text-gray-800">
              Available Slots
            </h3>

            {slotsLoading ? (
              <div className="flex justify-center py-4">
                <CircularProgress size={25} />
              </div>
            ) : doctorSlots.length === 0 ? (
              <div className="text-center text-red-500 py-3">
                No slots available for this date
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {doctorSlots.map((slot) => (
                  <button
                    key={`${slot.start}-${slot.end}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`
                      p-2 rounded-lg border text-sm
                      ${
                        selectedSlot?.start === slot.start
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white hover:bg-blue-50"
                      }
                    `}
                  >
                    {slot.start} - {slot.end}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <TextField
            placeholder="Reason for Follow Up"
            fullWidth
            multiline
            rows={3}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#87ade9",
                },
                "&:hover fieldset": {
                  borderColor: "#2167d6",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#1976d2",
                  borderWidth: "3px",
                },
              },
            }}
            variant="outlined"
            size="small"
            value={followUpReason}
            onChange={(e) => setFollowUpReason(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 p-3 border-t border-[var(--color-primary)] bg-[var(--color-bg)] sticky bottom-0">
        <Button variant="outlined" size="small" fullWidth onClick={onClose}>
          Cancel
        </Button>
        {hasFollowUp ? (
          <Button
            variant="contained"
            size="small"
            fullWidth
            disabled={loading}
            onClick={handleFollowUpUpdate}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Update Follow Up"
            )}
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Save Follow Up"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FollowUpCalender;
