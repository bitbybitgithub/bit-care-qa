import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { MenuItem, Switch, TextField } from "@mui/material";
import { Banknote, Bell, Camera, RotateCcw, Timer } from "lucide-react";
import UploadControl from "../UploadControl";

/* Card wrapper used by blocks on the page - fully responsive */
export const Card: React.FC<{
  title?: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
}> = (props) => (
  <section
    className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 w-full min-w-0 overflow-hidden">
    {(props.title || props.rightAction) && (
      <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {props.icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)]">
              {props.icon}
            </div>
          )}
          <div className="min-w-0">
            {typeof props.title === "string" ? (
              <h2 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                {props.title}
              </h2>
            ) : (
              props.title
            )}
            {props.subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-snug font-normal">
                {props.subtitle}
              </p>
            )}
          </div>
        </div>
        {props.rightAction && <div className="shrink-0 self-start sm:self-center">{props.rightAction}</div>}
      </div>
    )}
    {props.children}
  </section>
);

const useObjectUrl = (file: File | null) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
};

/* ---------------- 1. Branding Card (Exact UI from Profile.tsx / Screenshot 1) ---------------- */
export const BrandingCard: React.FC<{
  establishmentLabel: string;
  logoSrc?: string | null;
  logoFile: File | null;
  onFileChange: (file: File | null) => void;
  identity?: { label: string; value: string }[];
}> = ({ establishmentLabel, logoSrc, logoFile, onFileChange, identity }) => {
  const [isReplacingLogo, setIsReplacingLogo] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const preview = useObjectUrl(logoFile);

  const handleCancelLogoReplace = () => {
    setIsReplacingLogo(false);
    onFileChange(null);
    setFileError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Camera size={17} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900 truncate">
              {establishmentLabel} Branding
            </h3>
            <p className="text-xs text-slate-400 truncate font-normal">
              Logo &amp; Visual Identity
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Logo Preview / Display */}
        <div className="flex items-center gap-3">
          <div className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
            {preview || logoSrc ? (
              <img
                src={preview ?? logoSrc!}
                alt={`${establishmentLabel} Logo`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                No Logo
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 truncate">
              {preview
                ? "New Logo Selected"
                : logoSrc
                ? `Official ${establishmentLabel} Logo`
                : `Upload ${establishmentLabel} Logo`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              JPG, PNG or SVG · max 5 MB
            </p>

            {(logoSrc || preview) && !isReplacingLogo && (
              <button
                type="button"
                onClick={() => setIsReplacingLogo(true)}
                className="mt-1.5 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 hover:underline flex items-center gap-1 cursor-pointer transition-colors">
                <Camera size={13} />
                Replace Logo
              </button>
            )}
          </div>
        </div>

        {/* Upload Dropzone (shown if no logo or replacing or new preview selected) */}
        {(!logoSrc || isReplacingLogo || preview) && (
          <div className="pt-2.5 border-t border-slate-100">
            <UploadControl
              controlName={`${establishmentLabel.toLowerCase()}Logo`}
              file={logoFile}
              onFileChange={(f) => {
                onFileChange(f);
                if (f) setFileError(null);
              }}
              onError={setFileError}
              acceptedFileTypes=".jpg,.jpeg,.png,.svg"
              maxSizeMB={5}
              height="42px"
            />
            {fileError && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{fileError}</p>
            )}

            {isReplacingLogo && (
              <button
                type="button"
                onClick={handleCancelLogoReplace}
                className="mt-1.5 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium cursor-pointer transition-colors">
                <RotateCcw size={12} />
                Cancel replacement
              </button>
            )}
          </div>
        )}

        {/* Identity Details for Pharmacy or Clinic */}
        {identity && identity.length > 0 && (
          <dl className="pt-2.5 border-t border-slate-100 space-y-1.5">
            {identity.map((row) => (
              <div key={row.label} className="flex flex-col">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {row.label}
                </dt>
                <dd className="text-xs font-semibold text-slate-700 mt-0.5 break-words">
                  {row.value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

/* ---------------- 2. Cash on Delivery (COD) Card (Exact UI from Profile.tsx / Screenshot 1) ---------------- */
export const CodCard: React.FC<{
  establishmentLabel?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ establishmentLabel = "clinic", checked, onChange }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-emerald-50/50">
          <Banknote size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 leading-snug truncate">
            Cash on Delivery (COD)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
            Allow patients to pay consultation and service charges in cash upon arriving at the {establishmentLabel.toLowerCase()}.
          </p>
        </div>
      </div>

      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        size="small"
        inputProps={{ "aria-label": "Enable cash on delivery" }}
        sx={{
          shrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "var(--color-success)",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--color-success)",
          },
        }}
      />
    </div>

    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-slate-400 truncate">
        Payment Method Status:
      </span>
      <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
          checked
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
            : "bg-slate-100 text-slate-500 border border-slate-200"
        }`}>
        {checked ? "Active" : "Disabled"}
      </span>
    </div>
  </div>
);

/* ---------------- 3. Patient Reminders Card (Exact UI from Profile.tsx / Screenshot 1) ---------------- */
export const RemindersCard: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ checked, onChange }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-indigo-50/50">
          <Bell size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 leading-snug truncate">
            Patient Reminders
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
            Send automated appointment confirmations, reminders, and follow-up notifications directly to patients.
          </p>
        </div>
      </div>

      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        size="small"
        inputProps={{ "aria-label": "Send patient reminders" }}
        sx={{
          shrink: 0,
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "var(--color-primary)",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "var(--color-primary)",
          },
        }}
      />
    </div>

    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-slate-400 truncate">
        Reminders Notification:
      </span>
      <span
        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
          checked
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/70"
            : "bg-slate-100 text-slate-500 border border-slate-200"
        }`}>
        {checked ? "Active" : "Disabled"}
      </span>
    </div>
  </div>
);

const SLOT_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

/* ---------------- 4. Appointment Slot Duration Card (Exact UI from Profile.tsx / Screenshot 1) ---------------- */
export const SlotDurationCard: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-amber-50/50">
          <Timer size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 leading-snug truncate">
            Slot Duration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-normal">
            Time reserved for each patient consultation appointment.
          </p>
        </div>
      </div>
    </div>

    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-slate-400 truncate">
        Consultation Slot:
      </span>
      <div className="w-28 sm:w-32 shrink-0">
        <TextField
          id="clinic-slot-duration-select"
          select
          size="small"
          fullWidth
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              fontSize: 12.5,
              fontWeight: 600,
              backgroundColor: "var(--color-surface)",
              height: 30,
              "& fieldset": { borderColor: "var(--color-border)" },
              "&:hover fieldset": { borderColor: "var(--color-primary-light)" },
              "&.Mui-focused fieldset": {
                borderColor: "var(--color-primary)",
                borderWidth: "1.5px",
              },
            },
            "& .MuiSelect-select": {
              padding: "3px 24px 3px 10px !important",
              display: "flex",
              alignItems: "center",
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--color-text)",
            },
            "& .MuiSelect-icon": { right: 6, fontSize: 18, color: "var(--color-text-secondary)" },
          }}
          slotProps={{
            select: {
              MenuProps: {
                PaperProps: {
                  sx: {
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    maxHeight: 260,
                    "& .MuiMenuItem-root": {
                      fontSize: 12.5,
                      fontWeight: 500,
                      py: 0.7,
                      "&.Mui-selected": {
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-primary)",
                        fontWeight: 700,
                      },
                    },
                  },
                },
              },
            },
          }}>
          {SLOT_DURATION_OPTIONS.map((min) => (
            <MenuItem key={min} value={min}>
              {min} min
            </MenuItem>
          ))}
        </TextField>
      </div>
    </div>
  </div>
);