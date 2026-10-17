import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import { Switch } from "@mui/material";
import { Banknote, Bell, Camera, RotateCcw } from "lucide-react";
import UploadControl from "../UploadControl";

/* Card wrapper used by blocks on the page - fully responsive */
export const Card: React.FC<{
  title?: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, subtitle, icon, rightAction, children, className = "" }) => (
  <section
    className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 w-full min-w-0 overflow-hidden ${className}`}>
    {(title || rightAction) && (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {typeof title === "string" ? (
              <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-tight truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightAction && <div className="shrink-0 self-start sm:self-center">{rightAction}</div>}
      </div>
    )}
    {children}
  </section>
);

const useObjectUrl = (file: File | null) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
};

/* ---------------- 1. Branding Card (Exact UI from Profile.tsx - Responsive) ---------------- */
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Camera size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">
              {establishmentLabel} Branding
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Logo &amp; Visual Identity
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Logo Preview / Display */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
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
            <p className="text-xs font-semibold text-slate-800 truncate">
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
                className="mt-2 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors">
                <Camera size={13} />
                Replace Logo
              </button>
            )}
          </div>
        </div>

        {/* Upload Dropzone (shown if no logo or replacing or new preview selected) */}
        {(!logoSrc || isReplacingLogo || preview) && (
          <div className="pt-3 border-t border-slate-100">
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
              height="46px"
            />
            {fileError && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{fileError}</p>
            )}

            {isReplacingLogo && (
              <button
                type="button"
                onClick={handleCancelLogoReplace}
                className="mt-2 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium cursor-pointer transition-colors">
                <RotateCcw size={12} />
                Cancel replacement
              </button>
            )}
          </div>
        )}

        {/* Identity Details for Pharmacy or Clinic */}
        {identity && identity.length > 0 && (
          <dl className="pt-3 border-t border-slate-100 space-y-2">
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

/* ---------------- 2. Cash on Delivery (COD) Card (Exact UI from Profile.tsx - Responsive) ---------------- */
export const CodCard: React.FC<{
  establishmentLabel?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ establishmentLabel = "clinic", checked, onChange }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-emerald-50/50">
          <Banknote size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">
            Cash on Delivery (COD)
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
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
            color: "#059669",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#059669",
          },
        }}
      />
    </div>

    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-slate-400 truncate">
        Payment Method Status:
      </span>
      <span
        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
          checked
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
            : "bg-slate-100 text-slate-500 border border-slate-200"
        }`}>
        {checked ? "Active" : "Disabled"}
      </span>
    </div>
  </div>
);

/* ---------------- 3. Patient Reminders Card (Exact UI from Profile.tsx - Responsive) ---------------- */
export const RemindersCard: React.FC<{
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ checked, onChange }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 w-full min-w-0 overflow-hidden">
    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 ring-4 ring-indigo-50/50">
          <Bell size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-tight truncate">
            Patient Reminders
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">
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
            color: "#4f46e5",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#4f46e5",
          },
        }}
      />
    </div>

    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
      <span className="text-[11px] font-medium text-slate-400 truncate">
        Reminders Notification:
      </span>
      <span
        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
          checked
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/70"
            : "bg-slate-100 text-slate-500 border border-slate-200"
        }`}>
        {checked ? "Active" : "Disabled"}
      </span>
    </div>
  </div>
);