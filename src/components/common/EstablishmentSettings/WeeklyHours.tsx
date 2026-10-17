import React from "react";
import { Switch, TextField } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import type { WeeklyDay } from "./Types";
import { fieldSx } from "./Utils";

interface Props {
  days: WeeklyDay[];
  errors: Record<string | number, string | null>;
  hoursLabel?: string;
  onChange: (id: string | number, patch: Partial<WeeklyDay>) => void;
}

const WeeklyHours: React.FC<Props> = ({ days, errors, onChange }) => {
  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
        No weekdays are configured yet. Please contact support to enable your weekly schedule.
      </div>
    );
  }

  const openCount = days.filter((d) => d.isOpen).length;

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Top summary row matching Image 3 */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Regular single-shift operating hours:
        </p>
        <span
          className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-200/80 shadow-2xs"
          aria-live="polite">
          {openCount} of {days.length} days open
        </span>
      </div>

      <ul className="divide-y divide-slate-100">
        {days.map((d) => {
          const error = errors[d.id];
          const dayAbbr = d.day.slice(0, 3).toUpperCase();

          return (
            <li
              key={d.id}
              className={`py-3 px-2 sm:px-3 rounded-xl transition-all duration-200 ${
                d.isOpen ? "hover:bg-slate-50/70" : "bg-slate-50/30 opacity-75 hover:opacity-90"
              }`}>
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 sm:gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr_auto]">
                {/* Left: Day Badge & Label */}
                <div className="order-1 flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs uppercase transition-colors duration-200 ${
                      d.isOpen
                        ? "bg-[#0070ba] text-white shadow-2xs"
                        : "bg-slate-200 text-slate-500"
                    }`}>
                    {dayAbbr}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-[13.5px] font-semibold tracking-tight leading-tight truncate ${
                        d.isOpen ? "text-slate-800" : "text-slate-400"
                      }`}>
                      {d.day}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate font-normal">
                      {d.isOpen ? "Open" : "Day off"}
                    </p>
                  </div>
                </div>

                {/* Center: Time inputs */}
                <div className="order-3 col-span-2 min-w-0 sm:order-2 sm:col-span-1">
                  <AnimatePresence initial={false} mode="wait">
                    {d.isOpen ? (
                      <motion.div
                        key="open"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center gap-2 sm:gap-2.5 w-full max-w-xs sm:max-w-sm">
                        <TextField
                          type="time"
                          size="small"
                          fullWidth
                          sx={{
                            ...fieldSx,
                            "& .MuiOutlinedInput-root": {
                              height: { xs: 34, sm: 36 },
                              borderRadius: "10px",
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "6px 8px", sm: "7px 12px" },
                              fontSize: { xs: 12.5, sm: 13 },
                            },
                          }}
                          value={d.start}
                          error={!!error}
                          onChange={(e) => onChange(d.id, { start: e.target.value })}
                          inputProps={{ "aria-label": `${d.day} opening time` }}
                        />
                        <span className="text-xs font-medium text-slate-400 shrink-0 px-0.5" aria-hidden>
                          to
                        </span>
                        <TextField
                          type="time"
                          size="small"
                          fullWidth
                          sx={{
                            ...fieldSx,
                            "& .MuiOutlinedInput-root": {
                              height: { xs: 34, sm: 36 },
                              borderRadius: "10px",
                            },
                            "& .MuiInputBase-input": {
                              padding: { xs: "6px 8px", sm: "7px 12px" },
                              fontSize: { xs: 12.5, sm: 13 },
                            },
                          }}
                          value={d.end}
                          error={!!error}
                          onChange={(e) => onChange(d.id, { end: e.target.value })}
                          inputProps={{ "aria-label": `${d.day} closing time` }}
                        />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="closed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="text-xs sm:text-sm font-medium text-slate-400 italic">
                        Day off
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right: Status label & Toggle switch */}
                <div className="order-2 flex items-center gap-2 sm:order-3 justify-end shrink-0">
                  <span
                    className={`w-11 sm:w-14 text-right text-xs sm:text-sm font-bold ${
                      d.isOpen ? "text-emerald-600" : "text-slate-400"
                    }`}>
                    {d.isOpen ? "Open" : "Closed"}
                  </span>
                  <Switch
                    size="small"
                    checked={d.isOpen}
                    onChange={(e) => onChange(d.id, { isOpen: e.target.checked })}
                    inputProps={{ "aria-label": `${d.day} open` }}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#0284c7",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: "#0284c7",
                      },
                    }}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1 sm:ml-[10rem]">
                  <AlertCircle size={13} className="shrink-0" />
                  {error}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default React.memo(WeeklyHours);