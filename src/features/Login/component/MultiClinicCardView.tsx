import { Button } from "@mui/material";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Building2, Check } from "lucide-react";

interface MultiClinicCardViewProps {
  clinicsList: any[];
  onClinicSelect: (clinic: any) => void;
}

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] " +
  "focus-visible:ring-offset-2";

const MultiClinicCardView = ({
  clinicsList,
  onClinicSelect,
}: MultiClinicCardViewProps) => {
  const [selectedClinic, setSelectedClinic] = useState<any>(null);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  return (
    <div className="relative overflow-hidden bg-[var(--color-surface)]">
      {/* decorative motion (same language as the login / registration pages) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="anim-float-a absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)]" />
        <span className="anim-float-b absolute -bottom-16 -right-12 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_7%,transparent)]" />
        <span className="dot-grid anim-drift absolute right-4 top-4 h-14 w-14 text-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]" />
      </div>

      <div className="relative flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 border-b border-slate-100 pb-4 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] shadow-sm">
            <Building2 size={22} aria-hidden />
          </span>
          <div>
            <h2
              className="font-[var(--font-weight-bold)] text-[var(--color-text)]"
              style={{ fontSize: "var(--font-h3, 1.25rem)" }}>
              Select a{" "}
              <span className="text-[var(--color-primary)]">clinic</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Choose the clinic you want to log in to
            </p>
          </div>
        </div>

        {/* Clinic list */}
        <div
          role="radiogroup"
          aria-label="Clinics"
          className="flex max-h-60 flex-col gap-2 overflow-y-auto p-0.5 pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.12) transparent",
          }}>
          {clinicsList.map((clinic, i) => {
            const isSelected = selectedClinic?.clinic_id === clinic.clinic_id;
            return (
              <button
                key={clinic.clinic_id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedClinic(clinic)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`anim-fade-up flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 motion-reduce:transition-none ${FOCUS_RING} ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_6%,white)] shadow-sm"
                    : "border-slate-200 bg-white hover:border-[var(--color-primary)]/50"
                }`}>
                {/* Initials avatar */}
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-semibold ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-[var(--color-surface)]"
                      : "bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] text-[var(--color-primary)]"
                  }`}>
                  {getInitials(clinic.clinic_name)}
                </span>

                {/* Info */}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`truncate text-sm font-semibold ${
                      isSelected
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text)]"
                    }`}>
                    {clinic.clinic_name}
                  </span>
                  {clinic.address && (
                    <span className="mt-0.5 truncate text-xs text-slate-500">
                      {clinic.address}
                    </span>
                  )}
                </span>

                {/* Check */}
                <span
                  aria-hidden
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors motion-reduce:transition-none ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-surface)]"
                      : "border-slate-300 text-transparent"
                  }`}>
                  <Check size={12} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4">
          <Button
            type="button"
            fullWidth
            disabled={!selectedClinic}
            endIcon={<FaArrowRight size={12} />}
            onClick={() => selectedClinic && onClinicSelect(selectedClinic)}
            sx={{
              minHeight: 44,
              borderRadius: "10px",
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-surface)",
              "&:hover": {
                backgroundColor: "var(--color-primary)",
                opacity: 0.92,
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              },
              "&.Mui-disabled": {
                backgroundColor: "#e2e8f0",
                color: "#94a3b8",
              },
            }}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiClinicCardView;