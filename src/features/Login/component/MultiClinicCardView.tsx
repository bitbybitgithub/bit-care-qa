import { Button } from "@mui/material";
import { useState } from "react";
import { FaArrowRight, FaHospital, FaTimes } from "react-icons/fa";

interface MultiClinicCardViewProps {
  clinicsList: any[];
  onClinicSelect: (clinic: any) => void;
}

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
    <div
      className="relative p-5 flex flex-col gap-4 overflow-hidden"
      style={{
        background: "var(--color-surface)",
      }}
    >
      {/* Subtle top-left orb — uses primary color, very faint */}
      <div
        className="absolute -top-8 -left-8 w-36 h-36 rounded-full pointer-events-none"
        style={{
          background: "var(--color-primary)",
          opacity: 0.07,
          filter: "blur(36px)",
        }}
      />
      {/* Subtle bottom-right orb */}
      <div
        className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
        style={{
          background: "var(--color-primary)",
          opacity: 0.05,
          filter: "blur(28px)",
        }}
      />

      {/* Glass inner panel */}
      <div
        className="relative flex flex-col gap-4 rounded-2xl p-4"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow:
            "0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {/* Header */}
        <div
          className="flex flex-col items-center gap-2 pb-3"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <FaHospital size={20} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="text-center">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Select a clinic
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Choose the clinic you want to log in to
            </p>
          </div>
        </div>

        {/* Clinic list */}
        <div
          className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-0.5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0.12) transparent",
          }}
        >
          {clinicsList.map((clinic) => {
            const isSelected = selectedClinic?.clinic_id === clinic.clinic_id;
            return (
              <div
                key={clinic.clinic_id}
                onClick={() => setSelectedClinic(clinic)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: isSelected
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.35)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: isSelected
                    ? "1.5px solid var(--color-primary)"
                    : "1.5px solid rgba(0,0,0,0.07)",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(var(--color-primary-rgb, 99,102,241),0.08)"
                    : "none",
                    transform: isSelected ? "translateY(-1px)" : "none",
                  marginTop: isSelected ? "5px" : "0",
                }}
              >
                {/* Initials avatar */}
                <div
                  className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: isSelected
                      ? "var(--color-primary)"
                      : "rgba(0,0,0,0.06)",
                    color: isSelected
                      ? "#fff"
                      : "var(--color-text-secondary)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {getInitials(clinic.clinic_name)}
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className="text-sm font-medium truncate"
                    style={{
                      color: isSelected
                        ? "var(--color-primary)"
                        : "var(--color-text)",
                    }}
                  >
                    {clinic.clinic_name}
                  </span>
                  {clinic.address && (
                    <span
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {clinic.address}
                    </span>
                  )}
                </div>

                {/* Radio dot */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    border: isSelected
                      ? "2px solid var(--color-primary)"
                      : "2px solid rgba(0,0,0,0.18)",
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: "var(--color-primary)" }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 pt-3"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          {/* <Button
            variant="outlined"
            fullWidth
            onClick={() => onClinicSelect(null)}
            startIcon={<FaTimes size={12} />}
            sx={{
              borderRadius: "10px",
              py: 1,
              fontWeight: 500,
              textTransform: "none",
              fontSize: "13px",
              borderColor: "rgba(0,0,0,0.15)",
              color: "var(--color-text-secondary)",
              background: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(8px)",
              "&:hover": {
                borderColor: "rgba(0,0,0,0.25)",
                background: "rgba(255,255,255,0.75)",
              },
            }}
          >
            Cancel\
          </Button> */}
          <Button
            variant="contained"
            fullWidth
            disabled={!selectedClinic}
            endIcon={<FaArrowRight size={12} />}
            onClick={() => selectedClinic && onClinicSelect(selectedClinic)}
            sx={{
              borderRadius: "10px",
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              },
              "&.Mui-disabled": {
                background: "rgba(0,0,0,0.08)",
              },
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiClinicCardView;