import React, { useEffect, useRef, useState } from "react";
import { Button, CircularProgress, TextField } from "@mui/material";
import { MdClose } from "react-icons/md";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiTimeLine,
} from "react-icons/ri";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { toast } from "react-toastify";
import "./FollowUpCalender.css";
import {
  getAppointmentSlots,
  getfollowupData,
  saveAppointment,
  updateFollowUp,
  type AppointmentSlot,
  type DoctorFeeDuration,
  type FollowUpAppointmentDetails,
  type SaveAppointmentResponse,
  type UpdateFollowUpResponse,
} from "../../../api";
import { AppointmentStatus } from "../../../context/constant/enum";
import { getSessionItem } from "../../../context/sessions/userSession";
import { formatDateDDMMYYYY } from "../../../utils/DateUtils";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";

dayjs.extend(customParseFormat);

const parseCalendarDate = (value?: string | null): dayjs.Dayjs | null => {
  if (!value) return null;
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const parsed = isoDate
    ? dayjs(isoDate, "YYYY-MM-DD", true)
    : dayjs(value, "DD-MM-YYYY", true);
  return parsed.isValid() ? parsed : null;
};

const normalizeId = (value?: number | string | null): number | null => {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const normalizeBit = (value: boolean | number | string): boolean =>
  value === true || value === 1 || value === "1" || value === "true";

const normalizeTime = (value?: string | null): string | null => {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
};

interface Props {
  patient: Patient;
  onClose?: () => void;
  onSave?: (data: SaveAppointmentResponse | UpdateFollowUpResponse) => void;
}

const FollowUpCalender: React.FC<Props> = ({ patient, onClose, onSave }) => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const submissionInProgress = useRef(false);
  const [followUpReason, setFollowUpReason] = useState("");
  const [reasonValidationAttempted, setReasonValidationAttempted] =
    useState(false);

  const [followUps, setFollowUps] = useState<FollowUpAppointmentDetails[]>([]);
  const [rootId, setRootId] = useState<number | null>(null);
  const [rootAppointmentDate, setRootAppointmentDate] =
    useState<dayjs.Dayjs | null>(null);
  const [feeDurationDays, setFeeDurationDays] = useState<number | null>(null);

  const userId = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const startOfMonth = currentMonth.startOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(
    null,
  );
  const [doctorSlots, setDoctorSlots] = useState<AppointmentSlot[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFollowups = async () => {
      try {
        const appointmentId = Number(patient?.appointment_id);
        const patientId = Number(patient?.patient_id);
        const clinicIdNumber = Number(clinicId);
        const doctorId = Number(patient?.raw?.doctor_id);

        if (
          !Number.isInteger(appointmentId) ||
          appointmentId <= 0 ||
          !Number.isInteger(patientId) ||
          patientId <= 0 ||
          !Number.isInteger(clinicIdNumber) ||
          clinicIdNumber <= 0 ||
          !Number.isInteger(doctorId) ||
          doctorId <= 0
        ) {
          if (isMounted) {
            setFollowUps([]);
            setRootId(null);
            setRootAppointmentDate(null);
            setFeeDurationDays(null);
          }
          return;
        }

        const res = await getfollowupData(
          appointmentId,
          patientId,
          clinicIdNumber,
          doctorId,
        );
        if (!isMounted) return;

        // 1. Normalize follow-up appointment records
        const records = (res?.follow_up_appointments || []).map((record) => ({
          ...record,
          new_appointment_id: normalizeId(record.new_appointment_id),
          appointment_id: normalizeId(record.appointment_id),
          patient_id: normalizeId(record.patient_id) ?? record.patient_id,
          parent_appt_id: normalizeId(record.parent_appt_id),
          is_follow_up: normalizeBit(record.is_follow_up),
          is_visited: normalizeBit(record.is_visited),
          is_fee_applicable: normalizeBit(record.is_fee_applicable),
          is_fee_paid: normalizeBit(record.is_fee_paid),
          is_fee_duration_exceeded:
            record.is_fee_duration_exceeded == null
              ? null
              : normalizeBit(record.is_fee_duration_exceeded),
        }));
        setFollowUps(records);

        // 2. Resolve Root Appointment ID and Date
        let resolvedRootId: number | null = null;
        let resolvedRootDate: dayjs.Dayjs | null = null;

        if (res?.root_appointment) {
          resolvedRootId = normalizeId(res.root_appointment.appointment_id);
          resolvedRootDate = parseCalendarDate(
            res.root_appointment.appointment_date,
          );
        }

        // Fallback trace from records or patient if root_appointment not provided
        if (!resolvedRootId || !resolvedRootDate) {
          const parentIds = [
            ...new Set(
              records
                .map((r) => normalizeId(r.parent_appt_id))
                .filter((id): id is number => id !== null),
            ),
          ];
          if (parentIds.length === 1) {
            resolvedRootId = parentIds[0];
            const pRec = records.find(
              (r) =>
                normalizeId(r.parent_appt_id) === resolvedRootId &&
                r.parent_appt_date,
            );
            if (pRec?.parent_appt_date) {
              resolvedRootDate = parseCalendarDate(pRec.parent_appt_date);
            }
          } else if (parentIds.length === 0) {
            // Patient has no follow-ups yet; check if patient itself is the root
            const patientParentId = normalizeId(
              patient?.raw?.appt_follow_up_id,
            );
            if (!patientParentId) {
              resolvedRootId = normalizeId(patient?.appointment_id);
              const pDate =
                patient?.appointmentDate || patient?.raw?.appointment_date;
              if (pDate) {
                resolvedRootDate = parseCalendarDate(pDate);
              }
            }
          }
        }

        setRootId(resolvedRootId);
        setRootAppointmentDate(resolvedRootDate);

        // 3. Resolve Doctor Fee Duration
        let feeDurationVal: number | null = null;
        if (res?.doctor_fee_duration != null) {
          if (typeof res.doctor_fee_duration === "object") {
            const dur = (res.doctor_fee_duration as DoctorFeeDuration)
              .fees_duration;
            if (dur != null && !isNaN(Number(dur))) {
              feeDurationVal = Number(dur);
            }
          } else if (!isNaN(Number(res.doctor_fee_duration))) {
            feeDurationVal = Number(res.doctor_fee_duration);
          }
        }
        if (feeDurationVal == null) {
          const fromRecord = records.find(
            (r) => r.fees_duration != null,
          )?.fees_duration;
          if (fromRecord != null && !isNaN(Number(fromRecord))) {
            feeDurationVal = Number(fromRecord);
          }
        }
        setFeeDurationDays(feeDurationVal);

        // 4. Prefill reason if active pending follow-up exists
        const pending = records.find(
          (r) =>
            normalizeBit(r.is_follow_up) &&
            !normalizeBit(r.is_visited) &&
            (!("status" in r) ||
              String(r.status || "").toLowerCase() !== "cancelled"),
        );
        if (pending?.follow_up_reason) {
          setFollowUpReason((prev) => prev || (pending.follow_up_reason ?? ""));
        }
      } catch (error) {
        console.error("Failed to fetch follow-ups:", error);
        toast.error("Unable to load follow-up appointment details.");
        if (isMounted) {
          setFollowUps([]);
          setRootId(null);
          setRootAppointmentDate(null);
          setFeeDurationDays(null);
        }
      }
    };

    fetchFollowups();
    return () => {
      isMounted = false;
    };
  }, [
    patient?.appointment_id,
    patient?.patient_id,
    patient?.raw?.doctor_id,
    patient?.raw?.appt_follow_up_id,
    patient?.appointmentDate,
    patient?.raw?.appointment_date,
    clinicId,
  ]);

  // Active unvisited pending follow-up (eligible for reschedule or conflict resolution)
  const pendingFollowUp = followUps.find(
    (record) =>
      normalizeBit(record.is_follow_up) &&
      !normalizeBit(record.is_visited) &&
      (!("status" in record) ||
        String(record.status || "").toLowerCase() !== "cancelled"),
  );
  const pendingFollowUpId = pendingFollowUp
    ? normalizeId(
        pendingFollowUp.new_appointment_id ?? pendingFollowUp.appointment_id,
      )
    : null;

  const existingFollowUps = followUps.filter((record) =>
    normalizeBit(record.is_follow_up),
  );

  const isPrevDisabled =
    currentMonth.isSame(today, "month") ||
    currentMonth.isBefore(today, "month");

  const days: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(currentMonth.date(i));

  // Calculate validity deadline from verified root appointment date + fee duration
  const lastFollowUpDate =
    rootAppointmentDate && feeDurationDays !== null && feeDurationDays >= 0
      ? rootAppointmentDate.add(feeDurationDays, "day")
      : null;

  const rootIsValid = Boolean(
    rootId &&
    rootAppointmentDate &&
    feeDurationDays !== null &&
    lastFollowUpDate,
  );

  const isSelectedDateAfterFeeDuration =
    !!selectedDate &&
    !!lastFollowUpDate &&
    selectedDate.isAfter(lastFollowUpDate, "day");

  const handleSelect = async (date: dayjs.Dayjs) => {
    if (date.isBefore(today.startOf("day"))) {
      toast.error("Past date not allowed");
      return;
    }
    if (rootAppointmentDate && date.isBefore(rootAppointmentDate, "day")) {
      toast.error(
        "The selected date cannot be before the original appointment date.",
      );
      return;
    }

    setSelectedDate(date);
    setSelectedSlot(null);

    const selectedRecord = existingFollowUps.find(
      (record) =>
        parseCalendarDate(record.follow_up_date)?.format("YYYY-MM-DD") ===
        date.format("YYYY-MM-DD"),
    );

    if (selectedRecord && selectedRecord.follow_up_reason) {
      setFollowUpReason(selectedRecord.follow_up_reason);
    }

    try {
      setSlotsLoading(true);

      const res = await getAppointmentSlots({
        doctorId: Number(patient.raw?.doctor_id),
        clinicId: Number(clinicId),
        date: date.format("YYYY-MM-DD"),
      });

      if (res.success) {
        const availableSlots = res.slots
          .filter((slot) => slot.status === "AVAILABLE")
          .map((slot) => ({
            ...slot,
            start: normalizeTime(slot.start) ?? slot.start,
            end: normalizeTime(slot.end) ?? slot.end,
          }));

        setDoctorSlots(availableSlots);

        if (
          selectedRecord &&
          selectedRecord.start_time &&
          selectedRecord.end_time
        ) {
          const existingStart = normalizeTime(selectedRecord.start_time);
          const existingEnd = normalizeTime(selectedRecord.end_time);
          const existingSlot = availableSlots.find(
            (slot) => slot.start === existingStart && slot.end === existingEnd,
          );

          if (existingSlot) {
            setSelectedSlot(existingSlot);
          } else if (existingStart && existingEnd) {
            const bookedSlot: AppointmentSlot = {
              start: existingStart,
              end: existingEnd,
              status: "BOOKED",
            };
            setDoctorSlots((slots) => [...slots, bookedSlot]);
            setSelectedSlot(bookedSlot);
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

  const handlePrimaryActionClick = () => {
    if (submissionInProgress.current) return;
    if (!selectedDate) {
      toast.error("Please select follow-up date");
      return;
    }
    if (selectedDate.isBefore(today.startOf("day"))) {
      toast.error("Past date not allowed");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select an appointment slot");
      return;
    }
    if (!followUpReason.trim()) {
      setReasonValidationAttempted(true);
      toast.error("Please enter reason for follow up");
      return;
    }
    const patientId = Number(patient?.patient_id);
    const doctorId = Number(patient?.raw?.doctor_id);
    const clinicIdNumber = Number(clinicId);
    const userIdNumber = Number(userId);

    if (
      !Number.isInteger(patientId) ||
      patientId <= 0 ||
      !Number.isInteger(doctorId) ||
      doctorId <= 0 ||
      !Number.isInteger(clinicIdNumber) ||
      clinicIdNumber <= 0 ||
      !Number.isInteger(userIdNumber) ||
      userIdNumber <= 0
    ) {
      toast.error("Patient, doctor, clinic, or user details are missing");
      return;
    }
    if (!rootIsValid || !lastFollowUpDate || !rootAppointmentDate) {
      toast.error(
        "Unable to verify the original appointment and follow-up deadline. Please refresh and try again.",
      );
      return;
    }
    if (selectedDate.isBefore(rootAppointmentDate, "day")) {
      toast.error(
        "The selected date cannot be before the original appointment date.",
      );
      return;
    }

    if (isSelectedDateAfterFeeDuration) {
      void executeSaveRegularAppointment();
    } else if (pendingFollowUp && pendingFollowUpId) {
      void executeReschedule();
    } else {
      void executeSaveFollowUp();
    }
  };

  const executeReschedule = async () => {
    if (
      submissionInProgress.current ||
      !pendingFollowUpId ||
      !selectedDate ||
      !selectedSlot
    ) {
      return;
    }

    if (!followUpReason.trim()) {
      setReasonValidationAttempted(true);
      toast.error("Please enter reason for follow up");
      return;
    }

    // Use the actual root/parent appointment values from your existing state.
    if (!rootId || !rootAppointmentDate) {
      toast.error("Original appointment details are missing.");
      return;
    }

    const clinicIdNumber = Number(clinicId);
    const userIdNumber = Number(userId);

    submissionInProgress.current = true;
    setLoading(true);

    try {
      const response = await updateFollowUp({
        appointment_id: pendingFollowUpId,
        follow_up_date: selectedDate.format("YYYY-MM-DD"),
        follow_up_reason: followUpReason.trim(),
        clinic_id: clinicIdNumber,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        modified_by: userIdNumber,
        parent_appt_id: Number(rootId),
        parent_appointment_date: rootAppointmentDate.format("YYYY-MM-DD"),
      });
      if (!response?.success) {
        throw new Error(response?.message || "Failed to reschedule follow-up");
      }

      toast.success("Follow-up appointment rescheduled successfully");

      if (onSave) onSave(response);
      else onClose?.();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reschedule follow-up",
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  const executeSaveFollowUp = async () => {
    if (submissionInProgress.current || !selectedDate || !selectedSlot) return;
    if (!followUpReason.trim()) {
      setReasonValidationAttempted(true);
      toast.error("Please enter reason for follow up");
      return;
    }
    const patientId = Number(patient?.patient_id);
    const doctorId = Number(patient?.raw?.doctor_id);
    const clinicIdNumber = Number(clinicId);
    const userIdNumber = Number(userId);

    submissionInProgress.current = true;
    setLoading(true);
    try {
      const response = await saveAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicIdNumber,
        patient_name: patient.name,
        doctor_name: patient.doctor ?? "",
        gender: patient.gender,
        appointment_date: selectedDate.format("YYYY-MM-DD"),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        status: AppointmentStatus.Scheduled,
        source: "web",
        reason: followUpReason.trim(),
        date_of_birth: patient.date_of_birth
          ? String(patient.date_of_birth)
          : null,
        mobile_number: patient.mobile_number,
        user_id: userIdNumber,
        follow_up_id: rootId,
        parent_appt_id: rootId,
        parent_appointment_date:
          rootAppointmentDate?.format("YYYY-MM-DD") ?? null,
        is_follow_up: true,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to create follow-up");
      }
      toast.success("Follow-up created successfully");
      if (onSave) onSave(response);
      else onClose?.();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save follow-up",
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  const executeSaveRegularAppointment = async () => {
    if (submissionInProgress.current || !selectedDate || !selectedSlot) return;
    const patientId = Number(patient?.patient_id);
    const doctorId = Number(patient?.raw?.doctor_id);
    const clinicIdNumber = Number(clinicId);
    const userIdNumber = Number(userId);

    if (!followUpReason.trim()) {
      setReasonValidationAttempted(true);
      toast.error("Please enter reason for follow up");
      return;
    }
    const supersededId = pendingFollowUp ? pendingFollowUpId : null;

    submissionInProgress.current = true;
    setLoading(true);
    try {
      const response = await saveAppointment({
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicIdNumber,
        patient_name: patient.name,
        doctor_name: patient.doctor ?? "",
        gender: patient.gender,
        appointment_date: selectedDate.format("YYYY-MM-DD"),
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        status: AppointmentStatus.Scheduled,
        source: "web",
        reason: followUpReason.trim(),
        date_of_birth: patient.date_of_birth
          ? String(patient.date_of_birth)
          : null,
        mobile_number: patient.mobile_number,
        user_id: userIdNumber,
        // Tell the backend this is a regular appointment.
        is_follow_up: false,
        follow_up_id: null,
        parent_appt_id: null,
        parent_appointment_date: null,

        // Identify the pending follow-up row to convert.
        superseded_appointment_id: pendingFollowUpId ?? null,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to create regular appointment",
        );
      }

      if (supersededId) {
        toast.success(
          "Regular appointment created and previous pending follow-up cancelled successfully.",
        );
      } else {
        toast.success("Regular appointment created successfully.");
      }
      if (onSave) onSave(response);
      else onClose?.();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create regular appointment",
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  const reasonField = (
    <TextField
      label="Reason for follow up"
      placeholder="Enter reason for follow up"
      fullWidth
      multiline
      minRows={3}
      required
      value={followUpReason}
      error={reasonValidationAttempted && !followUpReason.trim()}
      helperText={
        reasonValidationAttempted && !followUpReason.trim()
          ? "Please enter a reason for follow up."
          : undefined
      }
      onChange={(event) => {
        setFollowUpReason(event.target.value);
        if (event.target.value.trim()) setReasonValidationAttempted(false);
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          "& fieldset": {
            borderColor: "rgba(var(--color-border), 0.3)",
          },
          "&:hover fieldset": {
            borderColor: "var(--color-primary)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "var(--color-primary)",
          },
        },
        "& .MuiInputLabel-root": {
          color: "var(--color-text-secondary)",
          "&.Mui-focused": {
            color: "var(--color-primary)",
          },
        },
      }}
    />
  );

  return (
    <div className="follow-up-calendar flex h-full min-h-0 flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[var(--color-border)]/20 bg-[var(--color-surface)] px-5 py-3.5 shadow-[var(--shadow-xs)]">
        <div>
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-[var(--color-text)]">
            <RiCalendarEventLine className="text-[var(--color-primary)] text-xl" />
            Set Patient Follow Up
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] font-medium">
            {patient?.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Set Patient Follow Up"
          className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] cursor-pointer"
        >
          <MdClose size={20} />
        </button>
      </header>

      <main className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
        {!rootIsValid && (
          <div
            role="alert"
            className="rounded-[var(--radius-lg)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-xs text-[var(--color-error)] font-medium"
          >
            Unable to verify the original appointment date or follow-up period.
            Follow-up scheduling is unavailable.
          </div>
        )}

        {pendingFollowUp && (
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)]/30 border-l-4 border-l-[var(--color-error)] bg-[var(--color-surface-alt)] px-4 py-3 shadow-[var(--shadow-xs)]">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-error)]">
              Pending follow-up scheduled
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
              {formatDateDDMMYYYY(pendingFollowUp.follow_up_date)}
              {pendingFollowUp.start_time && pendingFollowUp.end_time
                ? ` · ${normalizeTime(pendingFollowUp.start_time)} - ${normalizeTime(pendingFollowUp.end_time)}`
                : ""}
            </p>
          </section>
        )}

        {isSelectedDateAfterFeeDuration && (
          <section
            role="status"
            className="rounded-[var(--radius-lg)] border border-[var(--color-warning)]/40 border-l-4 border-l-[var(--color-warning)] bg-[var(--color-warning)]/10 p-3 text-xs sm:text-sm text-[var(--color-text)] font-medium shadow-[var(--shadow-xs)]"
          >
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Follow-up validity has expired. Standard consultation fees apply.
            </p>
            {pendingFollowUp && pendingFollowUpId && (
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Confirming will cancel the pending follow-up and book a regular appointment.
              </p>
            )}
          </section>
        )}

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)]/30 bg-[var(--color-surface-alt)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              disabled={isPrevDisabled}
              aria-label="Previous month"
              onClick={() =>
                !isPrevDisabled &&
                setCurrentMonth(currentMonth.subtract(1, "month"))
              }
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)]/40 text-[var(--color-text)] transition hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
            >
              <RiArrowLeftSLine size={18} />
            </button>

            <h3 className="flex items-center gap-2 text-sm sm:text-base font-bold text-[var(--color-text)]">
              <RiCalendarEventLine className="text-[var(--color-primary)]" />
              {currentMonth.format("MMMM YYYY")}
            </h3>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)]/40 text-[var(--color-text)] transition hover:bg-[var(--color-surface)] hover:border-[var(--color-primary)] cursor-pointer"
            >
              <RiArrowRightSLine size={18} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-[var(--color-text-secondary)]">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <div key={`${day}-${index}`} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 justify-items-center gap-y-1">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;

              const isPast = date.isBefore(today.startOf("day"));
              const isSelected = Boolean(
                selectedDate && date.isSame(selectedDate, "day"),
              );
              const isPendingDate = Boolean(
                pendingFollowUp &&
                parseCalendarDate(pendingFollowUp.follow_up_date)?.isSame(
                  date,
                  "day",
                ),
              );
              const isLastFollowUpDate = Boolean(
                lastFollowUpDate?.isSame(date, "day"),
              );

              return (
                <div
                  key={date.format("YYYY-MM-DD")}
                  title={
                    isLastFollowUpDate ? "Last valid follow-up date" : undefined
                  }
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  <button
                    type="button"
                    disabled={isPast}
                    onClick={() => handleSelect(date)}
                    aria-pressed={isSelected}
                    aria-label={`${date.format("dddd, MMMM D, YYYY")}${
                      isLastFollowUpDate ? ", last valid follow-up date" : ""
                    }`}
                    className={`flex h-full w-full items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isPast
                        ? "cursor-not-allowed text-[var(--color-text-secondary)]/30 font-normal"
                        : isSelected
                          ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] scale-105"
                          : isPendingDate
                            ? "bg-[var(--color-error)] text-white hover:opacity-90 font-bold"
                            : "text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                    } ${
                      isLastFollowUpDate && !isSelected
                        ? "ring-2 ring-[var(--color-warning)] ring-offset-1 text-[var(--color-text)] font-bold bg-[var(--color-warning)]/10"
                        : ""
                    }`}
                  >
                    {date.date()}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {selectedDate && (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)]/30 bg-[var(--color-surface-alt)] p-4 shadow-[var(--shadow-xs)] animate-fadeIn">
            <h3 className="mb-3 flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--color-text)]">
              <RiTimeLine className="text-[var(--color-primary)] text-base" />
              Select Time Slot
            </h3>

            {slotsLoading ? (
              <div className="flex justify-center py-6">
                <CircularProgress
                  size={24}
                  sx={{ color: "var(--color-primary)" }}
                />
              </div>
            ) : doctorSlots.length === 0 ? (
              <p className="py-4 text-center text-xs text-[var(--color-text-secondary)]">
                No slots available for this date
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {doctorSlots.map((slot) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  const isUnavailable = slot.status !== "AVAILABLE";

                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      disabled={isUnavailable}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-[var(--radius-lg)] border px-2 py-2 text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)] scale-[1.02]"
                          : isUnavailable
                            ? "border-[var(--color-border)]/20 bg-[var(--color-bg)] text-[var(--color-text-secondary)]/40 font-normal"
                            : "border-[var(--color-border)]/50 bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                      }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)]/30 bg-[var(--color-surface-alt)] p-4 shadow-[var(--shadow-xs)]">
          {reasonField}
        </section>
      </main>

      <footer className="flex shrink-0 gap-3 border-t border-[var(--color-border)]/20 bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)]">
        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
          sx={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
            borderRadius: "var(--radius-lg)",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            "&:hover": {
              borderColor: "var(--color-text)",
              backgroundColor: "var(--color-bg)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handlePrimaryActionClick}
          disabled={
            loading ||
            slotsLoading ||
            !selectedDate ||
            !selectedSlot ||
            !rootIsValid ||
            !lastFollowUpDate ||
            Boolean(
              selectedDate &&
              rootAppointmentDate &&
              selectedDate.isBefore(rootAppointmentDate, "day"),
            )
          }
          sx={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.8125rem",
            "&:hover": {
              backgroundColor: "var(--color-primary)",
              opacity: 0.9,
            },
            "&.Mui-disabled": {
              backgroundColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              opacity: 0.6,
            },
            textTransform: "none",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : isSelectedDateAfterFeeDuration ? (
            "Create Regular Appointment"
          ) : pendingFollowUp && pendingFollowUpId ? (
            "Reschedule Follow Up"
          ) : (
            "Save Follow Up"
          )}
        </Button>
      </footer>
    </div>
  );
};

export default FollowUpCalender;
