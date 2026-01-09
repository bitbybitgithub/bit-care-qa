
import React, { useState, useEffect, useCallback } from "react";
import {
  Switch,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { MdDeleteForever } from "react-icons/md";

/* ================= TYPES ================= */

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
    lab_opt_id: number | string;
    lab_id: number | string;
    day: string;
    is_active: boolean;
  };
  handleOperationDay: (
    lab_opt_id: number | string,
    lab_id: number | string,
    value: boolean
  ) => void;
  onShiftChange: (
    lab_opt_id: number | string,
    formattedShifts: ShiftPayload[]
  ) => void;
  initialShifts?: { start: string; end: string }[];
}

/* ================= COMPONENT ================= */

const LabShift: React.FC<DailyScheduleProps> = ({
  day,
  opShift,
  handleOperationDay,
  onShiftChange,
  initialShifts = [],
}) => {
  /* ================= STATE ================= */

  const [expanded, setExpanded] = useState<boolean>(opShift.is_active);
  const [shifts, setShifts] = useState<ShiftSlot[]>([]);

  /* ================= HELPERS ================= */

  const toMinutes = useCallback((time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }, []);

  const validateShifts = useCallback(
    (updated: ShiftSlot[]) => {
      const validated = updated.map((s) => ({ ...s, error: null }));

      const sorted = validated
        .map((s, idx) => ({ ...s, idx }))
        .sort(
          (a, b) =>
            toMinutes(a.start || "00:00") -
            toMinutes(b.start || "00:00")
        );

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

        if (
          curr.start &&
          curr.end &&
          prev.end &&
          toMinutes(curr.start) <= toMinutes(prev.end)
        ) {
          validated[curr.idx].error =
            "Shift must start after previous shift ends.";
        }
      }

      return validated;
    },
    [toMinutes]
  );

  /* ================= SYNC API DATA ================= */

  useEffect(() => {
    if (initialShifts.length > 0) {
      setShifts(
        initialShifts.map((s) => ({ ...s, error: null }))
      );
    } else if (expanded) {
      setShifts([{ start: "", end: "", error: null }]);
    } else {
      setShifts([]);
    }
  }, [initialShifts, expanded]);

  /* ================= UPDATE SHIFT ================= */

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

  const handleRemoveShift = useCallback((idx: number) => {
    setShifts((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  /* ================= NOTIFY PARENT ================= */

  useEffect(() => {
    // Day turned OFF → clear shifts
    if (!expanded) {
      onShiftChange(opShift.lab_opt_id, []);
      return;
    }

    // Prevent wiping parent state during typing
    const hasPartial = shifts.some(
      (s) => (s.start && !s.end) || (!s.start && s.end)
    );

    if (hasPartial) return;

    const valid = shifts.filter(
      (s) => s.start && s.end && !s.error
    );

    if (valid.length === 0) return;

    const payload: ShiftPayload[] = valid.map((s, i) => ({
      lab_id: opShift.lab_id,
      lab_opt_id: opShift.lab_opt_id,
      shift: i + 1,
      shift_start: s.start,
      shift_end: s.end,
      is_active: 1,
    }));

    onShiftChange(opShift.lab_opt_id, payload);
  }, [shifts, expanded, opShift, onShiftChange]);


  /* ================= UI ================= */

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
              const isActive = !e.target.checked;
              setExpanded(isActive);
              handleOperationDay(
                opShift.lab_opt_id,
                opShift.lab_id,
                isActive
              );
            }}
          />
        </div>
      </div>

      {/* Shifts */}
      {expanded && (
        <div className="space-y-4">
          {shifts.map((shift, idx) => (
            <div
              key={idx}
              className="flex gap-6 items-center"
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
              />

              {/* <IconButton
                onClick={() => handleRemoveShift(idx)}
              >
                <MdDeleteForever className="text-red-600" />
              </IconButton> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(LabShift);
