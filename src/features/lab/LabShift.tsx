
import React, { useState, useEffect, useCallback } from "react";
import {
  Switch,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { MdDeleteForever } from "react-icons/md";

interface ShiftSlot {
  start: string;
  end: string;
  error?: string | null;
}

interface ShiftPayload {
  lab_id: number | string;
  lab_opt_id: number | string;
  shift: number;
  shift_start: string;
  shift_end: string;
  is_active: number | boolean;
}

interface DailyScheduleProps {
  day: string;
  opShift: {
    lab_opt_id: string | number;
    lab_id: string | number;
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

const LabShift: React.FC<DailyScheduleProps> = ({
  day,
  opShift,
  handleOperationDay,
  onShiftChange,
  initialShifts = [],
}) => {
 
  const [expanded, setExpanded] = useState(() => !opShift.is_active);
  const [shifts, setShifts] = useState<ShiftSlot[]>(() =>
    initialShifts.map((s) => ({ ...s, error: null }))
  );

  // Convert HH:mm → minutes
  const toMinutes = useCallback((time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }, []);

  // Validation
  const validateShifts = useCallback(
    (updated: ShiftSlot[]): ShiftSlot[] => {
      const validated = updated.map((s) => ({ ...s, error: null }));

      const sorted = validated
        .map((s, idx) => ({ ...s, idx }))
        .sort((a, b) => toMinutes(a.start || "00:00") - toMinutes(b.start || "00:00"));

      const seen = new Set<string>();
      sorted.forEach((s) => {
        const key = `${s.start}-${s.end}`;
        if (s.start && s.end && seen.has(key)) {
          validated[s.idx].error = "Duplicate shift timings.";
        } else if (s.start && s.end) {
          seen.add(key);
        }
      });

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        if (curr.start && curr.end && prev.end) {
          if (toMinutes(curr.start) <= toMinutes(prev.end)) {
            validated[curr.idx].error =
              "Shift must start after previous shift ends.";
          }
        }
      }

      return validated;
    },
    [toMinutes]
  );

  const updateShift = useCallback(
    (index: number, field: keyof ShiftSlot, value: string) => {
      setShifts((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return validateShifts(updated);
      });
    },
    [validateShifts]
  );

  // Remove shift
  const handleRemoveShift = useCallback(
    (idx: number) => {
      if (idx < initialShifts.length) {
        toast.warn("Removing saved shifts not allowed.");
        return;
      }
      setShifts((prev) => prev.filter((_, i) => i !== idx));
    },
    [initialShifts.length]
  );

  // Auto add empty shift when expanded and no shifts
  useEffect(() => {
    if (expanded && shifts.length === 0) {
      setShifts([{ start: "", end: "", error: null }]);
    }

    if (!expanded) {
      setShifts([]);
    }
  }, [expanded]);

  // Notify parent on valid shifts or expanded change
  useEffect(() => {
    const valid = shifts.filter((s) => s.start && s.end && !s.error);

    const payload: ShiftPayload[] = valid.map((s, i) => ({
      lab_id: opShift.lab_id,
      lab_opt_id: opShift.lab_opt_id,
      shift: i + 1,
      shift_start: s.start,
      shift_end: s.end,
      is_active: expanded ? 1 : 0,
    }));

    onShiftChange(opShift.lab_opt_id, payload);
  }, [shifts, expanded]);

 return (
  <div className="rounded-lg p-4 mb-4 border-2 border-[var(--color-primary)]">
    {/* Header */}
    <div className="flex justify-between items-center mb-3">
      <Typography variant="h6">{day}</Typography>

      <div className="flex items-center gap-2">
        <Typography variant="body2">Holiday:</Typography>
        <Switch
          checked={!expanded}
          onChange={(e) => {
            const newExpanded = !e.target.checked;
            setExpanded(newExpanded);
            handleOperationDay(opShift.lab_opt_id, opShift.lab_id, newExpanded);
          }}
        />
      </div>
    </div>

    {/* Shift inputs */}
    {opShift.is_active && (
      <div className="space-y-4">
        {shifts.map((shift, idx) => {
          const isDisabled = idx < initialShifts.length;

          return (
            <div
              key={idx}
             className="flex flex-2 sm:flex-3 gap-6 items-center"
            >
              <TextField
                label="Shift Start"
                type="time"
                value={shift.start}
                onChange={(e) =>
                  updateShift(idx, "start", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!shift.error}
                disabled={isDisabled}
              />

              <TextField
                label="Shift End"
                type="time"
                value={shift.end}
                onChange={(e) =>
                  updateShift(idx, "end", e.target.value)
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!shift.error}
                helperText={shift.error || ""}
                disabled={isDisabled}
              />

              <IconButton
                onClick={(e) => {
                  handleRemoveShift(idx)
                  setExpanded(!expanded);
                }}
                disabled={isDisabled}
              >
                <MdDeleteForever className="text-red-600" />
              </IconButton>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}

export default React.memo(LabShift);


