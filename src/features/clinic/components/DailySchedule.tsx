import React, { useState, useEffect } from "react";
import { Switch, IconButton, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { MdDeleteForever } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { TimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const MAX_SHIFTS = 2;

interface ShiftSlot {
  start: string;
  end: string;
  error?: string | null;
}

interface ShiftPayload {
  clinic_id: number | string;
  co_id: number | string;
  shift: number;
  shift_start: string;
  shift_end: string;
  is_active: number | boolean;
}

interface Props {
  day: string;
  opShift: {
    co_id: string | number;
    clinic_id: string | number;
    day: string;
    is_active: boolean;
  };
  handleOperationDay: any;
  onShiftChange: any;
  initialShifts?: { start: string; end: string }[];
}

const SHIFT_META = [
  { label: "Morning", icon: "🌤" },
  { label: "Evening", icon: "🌙" },
];

const DailySchedule: React.FC<Props> = ({
  day,
  opShift,
  handleOperationDay,
  onShiftChange,
  initialShifts = [],
}) => {
  const [shifts, setShifts] = useState<ShiftSlot[]>(
    initialShifts.map((s) => ({ ...s, error: null }))
  );

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const validate = (data: ShiftSlot[]) => {
    const updated = data.map((s) => ({ ...s, error: null }));
    const sorted = [...updated].sort(
      (a, b) => toMinutes(a.start || "00:00") - toMinutes(b.start || "00:00")
    );
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      if (!curr.start || !curr.end) continue;
      if (toMinutes(curr.end) <= toMinutes(curr.start)) {
        curr.error = "End must be after start";
      }
      if (i > 0) {
        const prev = sorted[i - 1];
        if (toMinutes(curr.start) <= toMinutes(prev.end)) {
          curr.error = "Overlapping shift";
        }
      }
    }
    return updated;
  };

  const updateShift = (index: number, field: "start" | "end", value: string) => {
    setShifts((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return validate(updated);
    });
  };

  const addShift = () => {
    if (shifts.length >= MAX_SHIFTS) {
      toast.warn("Max 2 shifts allowed per day");
      return;
    }
    setShifts((prev) => [...prev, { start: "", end: "", error: null }]);
  };

  const removeShift = (index: number) => {
    setShifts((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const valid = shifts.filter((s) => s.start && s.end && !s.error);
    const formatted: ShiftPayload[] = valid.map((s, i) => ({
      clinic_id: opShift.clinic_id,
      co_id: opShift.co_id,
      shift: i + 1,
      shift_start: s.start,
      shift_end: s.end,
      is_active: opShift.is_active ? 1 : 0,
    }));
    onShiftChange(opShift.co_id, formatted);
  }, [shifts, opShift.is_active]);

  // is_active: true = Open, false = Closed
  const isOpen = opShift.is_active;
  const dayAbbr = day.slice(0, 3).toUpperCase();
  const scheduledCount = shifts.filter((s) => s.start && s.end && !s.error).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`
        relative rounded-[var(--radius-lg)] border bg-[var(--color-bg)]
        shadow-[var(--shadow-md)] overflow-hidden transition-all
        ${isOpen ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"}
      `}
    >
      {/* Open indicator — slim top bar using primary color */}
      {isOpen && (
        <div className="h-[3px] w-full bg-[var(--color-primary)] rounded-t-[var(--radius-lg)]" />
      )}

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Day badge + name */}
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0
              ${isOpen
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"}
            `}
          >
            <span className="text-[11px] font-bold tracking-wide">{dayAbbr}</span>
          </div>

          <div>
            <p
              className={`text-sm font-semibold leading-tight ${
                isOpen ? "text-[var(--color-text)]" : "text-[var(--color-text-secondary)]"
              }`}
            >
              {day}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              {isOpen
                ? scheduledCount > 0
                  ? `${scheduledCount} shift${scheduledCount !== 1 ? "s" : ""} scheduled`
                  : "No shifts added"
                : "Day off"}
            </p>
          </div>
        </div>

        {/* Status pill + switch */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              isOpen
                ? "bg-green-50 text-green-600"
                : "text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)]"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>

          {/* 
            checked = true  → switch ON  → is_active true  → Open
            checked = false → switch OFF → is_active false → Closed
          */}
          <Switch
            checked={isOpen}
            onChange={(e) =>
              handleOperationDay(opShift.co_id, opShift.clinic_id, e.target.checked)
            }
            size="small"
          />
        </div>
      </div>

      {/* ── SHIFTS (only when open) ───────────────────────────── */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)]">
          <AnimatePresence>
            {shifts.map((shift, index) => {
              const meta = SHIFT_META[index] ?? SHIFT_META[1];
              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mt-3 rounded-[var(--radius-md)] border overflow-hidden ${
                    shift.error
                      ? "border-red-300 bg-red-50"
                      : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"
                  }`}
                >
                  {/* Shift row label */}
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <span>{meta.icon}</span>
                      Shift {index + 1} · {meta.label}
                    </span>
                    <IconButton
                      onClick={() => removeShift(index)}
                      size="small"
                      className="!p-0.5"
                    >
                      <MdDeleteForever
                        className="text-[var(--color-error)]"
                        style={{ fontSize: "16px" }}
                      />
                    </IconButton>
                  </div>

                  {/* Time pickers */}
                  <div className="flex gap-2 px-3 py-2.5">
                    <TimePicker
                      label="Start"
                      value={shift.start ? dayjs(`2023-01-01 ${shift.start}`) : null}
                      onChange={(value) => {
                        if (!value) return;
                        updateShift(index, "start", value.format("HH:mm"));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "var(--radius-md)",
                              fontSize: "13px",
                              background: "var(--color-bg)",
                              "&:hover fieldset": { borderColor: "var(--color-primary)" },
                              "&.Mui-focused fieldset": { borderColor: "var(--color-primary)" },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: "var(--color-primary)",
                            },
                          },
                        },
                      }}
                    />
                    <TimePicker
                      label="End"
                      value={shift.end ? dayjs(`2023-01-01 ${shift.end}`) : null}
                      onChange={(value) => {
                        if (!value) return;
                        updateShift(index, "end", value.format("HH:mm"));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!shift.error,
                          helperText: shift.error,
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "var(--radius-md)",
                              fontSize: "13px",
                              background: "var(--color-bg)",
                              "&:hover fieldset": {
                                borderColor: shift.error ? "var(--color-error)" : "var(--color-primary)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: shift.error ? "var(--color-error)" : "var(--color-primary)",
                              },
                            },
                            "& .MuiInputLabel-root.Mui-focused": {
                              color: shift.error ? "var(--color-error)" : "var(--color-primary)",
                            },
                            "& .MuiFormHelperText-root": {
                              fontSize: "11px",
                              marginTop: "3px",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add shift / limit reached */}
          {shifts.length < MAX_SHIFTS ? (
            <motion.button
              layout
              onClick={addShift}
              className="
                mt-3 w-full py-2 rounded-[var(--radius-md)]
                border border-dashed border-[var(--color-border)]
                text-[var(--color-primary)] text-xs font-semibold
                flex items-center justify-center gap-1.5
                hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-primary)]
                transition-all
              "
            >
              <Add style={{ fontSize: "15px" }} />
              Add Shift
              <span className="ml-1 text-[10px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] px-1.5 py-0.5 rounded-full border border-[var(--color-border)]">
                {shifts.length}/{MAX_SHIFTS}
              </span>
            </motion.button>
          ) : (
            <p className="mt-3 text-center text-[11px] text-[var(--color-text-secondary)]">
              Maximum 2 shifts reached
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(DailySchedule);

// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Switch,
//   TextField,
//   Button,
//   IconButton,
//   Typography,
// } from "@mui/material";
// import { Add } from "@mui/icons-material";
// import { toast } from "react-toastify";
// import { MdDeleteForever } from "react-icons/md";

// interface ShiftSlot {
//   start: string;
//   end: string;
//   error?: string | null;
// }

// interface ShiftPayload {
//   clinic_id: number | string;
//   co_id: number | string;
//   shift: number;
//   shift_start: string;
//   shift_end: string;
//   is_active: number | boolean;
// }

// interface DailyScheduleProps {
//   day: string;
//   opShift: {
//     co_id: string | number;
//     clinic_id: string | number;
//     day: string;
//     is_active: boolean;
//   };
//   handleOperationDay: (
//     coId: string | number,
//     clinicId: string | number,
//     value: boolean
//   ) => void;
//   onShiftChange: (
//     coId: number | string,
//     formattedShifts: ShiftPayload[]
//   ) => void;
//   initialShifts?: { start: string; end: string }[];
// }

// const DailySchedule: React.FC<DailyScheduleProps> = ({
//   day,
//   opShift,
//   handleOperationDay,
//   onShiftChange,
//   initialShifts = [],
// }) => {
//   const [shifts, setShifts] = useState<ShiftSlot[]>(() =>
//     initialShifts.map((s) => ({ ...s, error: null }))
//   );

//   const toMinutes = useCallback((time: string) => {
//     const [h, m] = time.split(":").map(Number);
//     return h * 60 + m;
//   }, []);

//   const validateShifts = useCallback(
//     (updated: ShiftSlot[]): ShiftSlot[] => {
//       const validated = updated.map((s) => ({ ...s, error: null }));

//       const sorted = validated
//         .map((s, idx) => ({ ...s, idx }))
//         .sort((a, b) => {
//           if (!a.start || !b.start) return 0;
//           return toMinutes(a.start) - toMinutes(b.start);
//         });

//       const seen = new Set<string>();
//       sorted.forEach((s) => {
//         const key = `${s.start}-${s.end}`;
//         if (s.start && s.end && seen.has(key)) {
//           validated[s.idx].error = "Duplicate shift timings.";
//         } else if (s.start && s.end) {
//           seen.add(key);
//         }
//       });

//       for (let i = 1; i < sorted.length; i++) {
//         const prev = sorted[i - 1];
//         const curr = sorted[i];

//         if (prev.start && prev.end && curr.start && curr.end) {
//           const prevEnd = toMinutes(prev.end);
//           const currStart = toMinutes(curr.start);
//           const currEnd = toMinutes(curr.end);

//           if (currStart <= prevEnd) {
//             validated[curr.idx].error =
//               "Shift must start after previous shift ends.";
//           } else if (currEnd <= currStart) {
//             validated[curr.idx].error = "End time must be after start time.";
//           }
//         }
//       }

//       return validated;
//     },
//     [toMinutes]
//   );

//   const updateShift = useCallback(
//     (index: number, field: keyof ShiftSlot, value: string) => {
//       setShifts((prev) => {
//         const updated = [...prev];
//         updated[index] = { ...updated[index], [field]: value };
//         const validated = validateShifts(updated);
//         return validated;
//       });
//     },
//     [validateShifts]
//   );

//   const handleAddShift = useCallback(() => {
//     setShifts((prev) => {
//       let suggestedStart = "";
//       if (prev.length > 0 && prev[prev.length - 1].end) {
//         const lastEnd = toMinutes(prev[prev.length - 1].end);
//         const hrs = Math.floor((lastEnd + 1) / 60)
//           .toString()
//           .padStart(2, "0");
//         const mins = ((lastEnd + 1) % 60).toString().padStart(2, "0");
//         suggestedStart = `${hrs}:${mins}`;
//       }
//       return [...prev, { start: suggestedStart, end: "", error: null }];
//     });
//   }, [toMinutes]);

//   const handleRemoveShift = useCallback(
//     (idx: number) => {
//       if (idx < initialShifts.length) {
//         toast.warn("Removing saved shifts not implemented yet.");
//         return;
//       }
//       setShifts((prev) => prev.filter((_, i) => i !== idx));
//     },
//     [initialShifts.length]
//   );

//   useEffect(() => {
//     const validShifts = shifts.filter((s) => s.start && s.end && !s.error);
//     const formatted: ShiftPayload[] = validShifts.map((s, i) => ({
//       clinic_id: opShift.clinic_id,
//       co_id: opShift.co_id,
//       shift: i + 1,
//       shift_start: s.start,
//       shift_end: s.end,
//       is_active: opShift.is_active ? 1 : 0,
//     }));

//     onShiftChange(opShift.co_id, formatted);
//   }, [shifts, opShift.is_active]);

//   return (
//     <div className="rounded-[var(--radius-lg)] p-4 mb-4 border-2 border-[var(--color-primary)] shadow-[var(--shadow-md)]">
//       <div className="flex justify-between items-center mb-3">
//         <Typography variant="h6" className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
//           {day}
//         </Typography>
//         <div className="flex items-center gap-2">
//           <Typography variant="body2">Holiday:</Typography>
//           <Switch
//             checked={!opShift.is_active}
//             onChange={(e) =>
//               handleOperationDay(
//                 opShift.co_id,
//                 opShift.clinic_id,
//                 !e.target.checked
//               )
//             }
//           />
//         </div>
//       </div>
      
//       {opShift.is_active && (
//         <>
//           <div className="space-y-4 my-4">
//             {shifts.map((shift, idx) => {
//               const isDisabled = idx < initialShifts.length;
//               return (
//                 <div
//                   key={idx}
//                   className="flex flex-2 sm:flex-3 gap-6 items-center"
//                 >
//                   <TextField
//                     label="Shift Start"
//                     type="time"
//                     value={shift.start}
//                     disabled={isDisabled}
//                     onChange={(e) => updateShift(idx, "start", e.target.value)}
//                     fullWidth
//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                     error={!!shift.error}
//                   />

//                   <TextField
//                     label="Shift End"
//                     type="time"
//                     value={shift.end}
//                     disabled={isDisabled}
//                     onChange={(e) => updateShift(idx, "end", e.target.value)}
//                     InputLabelProps={{
//                       shrink: true,
//                     }}
//                     fullWidth
//                     error={!!shift.error}
//                     helperText={shift.error || ""}
//                   />
//                   <IconButton
//                     onClick={() => handleRemoveShift(idx)}
//                     className="w-10 h-10 p-5"
//                   >
//                     <MdDeleteForever className="text-[var(--color-error)] " />
//                   </IconButton>
//                 </div>
//               );
//             })}
//           </div>

//           <Button
//             startIcon={<Add />}
//             onClick={handleAddShift}
//             variant="outlined"
//             className="mt-2"
//           >
//             Add Shift
//           </Button>
//         </>
//       )}
//     </div>
//   );
// };

// export default React.memo(DailySchedule);

