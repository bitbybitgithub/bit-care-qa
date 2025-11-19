import React, { useState, useEffect, useCallback } from "react";
import {
  Switch,
  TextField,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { toast } from "react-toastify";
import { MdDeleteForever } from "react-icons/md";

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

interface DailyScheduleProps {
  day: string;
  opShift: {
    co_id: string | number;
    clinic_id: string | number;
    day: string;
    is_active: boolean;
  };
  handleOperationDay: (
    coId: string | number,
    clinicId: string | number,
    value: boolean
  ) => void;
  onShiftChange: (
    coId: number | string,
    formattedShifts: ShiftPayload[]
  ) => void;
  initialShifts?: { start: string; end: string }[];
}

const DailySchedule: React.FC<DailyScheduleProps> = ({
  day,
  opShift,
  handleOperationDay,
  onShiftChange,
  initialShifts = [],
}) => {
  const [shifts, setShifts] = useState<ShiftSlot[]>(() =>
    initialShifts.map((s) => ({ ...s, error: null }))
  );

  // Convert "HH:mm" → minutes since midnight
  const toMinutes = useCallback((time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }, []);

  // Main validation logic
  const validateShifts = useCallback(
    (updated: ShiftSlot[]): ShiftSlot[] => {
      const validated = updated.map((s) => ({ ...s, error: null }));

      // Sort by start time (for easier sequence validation)
      const sorted = validated
        .map((s, idx) => ({ ...s, idx }))
        .sort((a, b) => {
          if (!a.start || !b.start) return 0;
          return toMinutes(a.start) - toMinutes(b.start);
        });

      // Check duplicates (exact start–end pairs)
      const seen = new Set<string>();
      sorted.forEach((s) => {
        const key = `${s.start}-${s.end}`;
        if (s.start && s.end && seen.has(key)) {
          validated[s.idx].error = "Duplicate shift timings.";
        } else if (s.start && s.end) {
          seen.add(key);
        }
      });

      // Sequential validation
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (prev.start && prev.end && curr.start && curr.end) {
          const prevEnd = toMinutes(prev.end);
          const currStart = toMinutes(curr.start);
          const currEnd = toMinutes(curr.end);

          // Overlap / non-sequence check
          if (currStart <= prevEnd) {
            validated[curr.idx].error =
              "Shift must start after previous shift ends.";
          } else if (currEnd <= currStart) {
            validated[curr.idx].error = "End time must be after start time.";
          }
        }
      }

      return validated;
    },
    [toMinutes]
  );

  // Update shift value
  const updateShift = useCallback(
    (index: number, field: keyof ShiftSlot, value: string) => {
      setShifts((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        const validated = validateShifts(updated);
        return validated;
      });
    },
    [validateShifts]
  );

  // Add new shift (automatically starts after last shift end if possible)
  const handleAddShift = useCallback(() => {
    setShifts((prev) => {
      let suggestedStart = "";
      if (prev.length > 0 && prev[prev.length - 1].end) {
        const lastEnd = toMinutes(prev[prev.length - 1].end);
        const hrs = Math.floor((lastEnd + 1) / 60)
          .toString()
          .padStart(2, "0");
        const mins = ((lastEnd + 1) % 60).toString().padStart(2, "0");
        suggestedStart = `${hrs}:${mins}`;
      }
      return [...prev, { start: suggestedStart, end: "", error: null }];
    });
  }, [toMinutes]);

  // Remove shift
  const handleRemoveShift = useCallback(
    (idx: number) => {
      if (idx < initialShifts.length) {
        toast.warn("Removing saved shifts not implemented yet.");
        return;
      }
      setShifts((prev) => prev.filter((_, i) => i !== idx));
    },
    [initialShifts.length]
  );

  // Push valid shifts to parent when changed
  useEffect(() => {
    const validShifts = shifts.filter((s) => s.start && s.end && !s.error);
    const formatted: ShiftPayload[] = validShifts.map((s, i) => ({
      clinic_id: opShift.clinic_id,
      co_id: opShift.co_id,
      shift: i + 1,
      shift_start: s.start,
      shift_end: s.end,
      is_active: opShift.is_active ? 1 : 0,
    }));

    onShiftChange(opShift.co_id, formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, opShift.is_active]);

  return (
    <div className=" rounded-[var(--radius-lg)] p-4 mb-4 border-2 border-[var(--color-primary)] shadow-[var(--shadow-md)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6" className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
          {day}
        </Typography>
        <div className="flex items-center gap-2">
          <Typography variant="body2">Holiday:</Typography>
          <Switch
            checked={!opShift.is_active}
            onChange={(e) =>
              handleOperationDay(
                opShift.co_id,
                opShift.clinic_id,
                !e.target.checked
              )
            }
          />
        </div>
      </div>

      {/* Shift inputs */}
      {opShift.is_active && (
        <>
          <div className="space-y-3 mb-3">
            {shifts.map((shift, idx) => {
              const isDisabled = idx < initialShifts.length;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center"
                >
                  <TextField
                    label="Shift Start"
                    type="time"
                    value={shift.start}
                    disabled={isDisabled}
                    onChange={(e) => updateShift(idx, "start", e.target.value)}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!shift.error}
                  />

                  <TextField
                    label="Shift End"
                    type="time"
                    value={shift.end}
                    disabled={isDisabled}
                    onChange={(e) => updateShift(idx, "end", e.target.value)}
                    InputLabelProps={{
                      shrink: true, 
                    }}
                    fullWidth
                    error={!!shift.error}
                    helperText={shift.error || ""}
                  />
                  <IconButton
                    onClick={() => handleRemoveShift(idx)}
                    className="w-10 h-10 p-5"
                  >
                    <MdDeleteForever className="text-[var(--color-error)] " />
                  </IconButton>
                </div>
              );
            })}
          </div>

          <Button
            startIcon={<Add />}
            onClick={handleAddShift}
            variant="outlined"
            className="mt-2"
          >
            Add Shift
          </Button>
        </>
      )}
    </div>
  );
};

export default React.memo(DailySchedule);
