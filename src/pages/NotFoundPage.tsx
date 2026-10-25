import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import {
  FaClinicMedical,
  FaArrowLeft,
  FaHeartbeat,
  FaSearch,
  FaFileMedical,
  FaHeadset,
} from "react-icons/fa";
import { RiShieldCrossLine, RiPulseLine } from "react-icons/ri";

export function getFallbackDashboardRoute(): string {
  try {
    const raw = sessionStorage.getItem("user");
    if (!raw) return "/login";
    const user = JSON.parse(raw);
    const entityType = Number(user.entity_type);
    const role = String(user.role || "");

    const DASHBOARD_ROUTES: Record<number, Record<string, string>> = {
      1: {
        Admin: "/clinic/dashboard",
        Staff: "/staff/dashboard",
        Doctor: "/doctor/dashboard",
      },
      2: {
        Admin: "/lab/dashboard",
        Staff: "/lab/dashboard",
        Doctor: "/lab/dashboard",
        Technician: "/lab/dashboard",
      },
      3: {
        Admin: "/pharmacy/dashboard",
        Staff: "/pharmacy/dashboard",
      },
      4: {
        Doctor: "/doctor/dashboard",
      },
      5: {
        support: "/support/dashboard",
      },
    };

    const route = DASHBOARD_ROUTES[entityType]?.[role];
    if (route) return route;

    if (user.clinic_id) return "/clinic/dashboard";
    if (user.lab_id) return "/lab/dashboard";
    if (user.pharmacy_id) return "/pharmacy/dashboard";
    if (user.doctor_id) return "/doctor/dashboard";

    return "/login";
  } catch {
    return "/login";
  }
}

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const dashboardRoute = getFallbackDashboardRoute();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(dashboardRoute);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <div className="relative w-full max-w-2xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-6 sm:p-10 text-center overflow-hidden flex flex-col items-center">
        {/* Ambient background glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full pointer-events-none opacity-10 blur-3xl"
          style={{ backgroundColor: "var(--color-primary)" }}
        />

        {/* Clinical Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 text-[var(--color-primary)] text-xs font-bold tracking-wide uppercase mb-6 animate-fadeIn">
          <RiPulseLine className="text-sm animate-pulse" />
          <span>Status 404 • Medical Resource Missing</span>
        </div>

        {/* Healthcare Medical Illustration */}
        <div className="relative w-44 h-40 sm:w-52 sm:h-44 my-2 flex items-center justify-center">
          {/* Circular pulse rings */}
          <div className="absolute inset-0 m-auto w-32 h-32 rounded-full border border-[var(--color-primary)]/20 animate-ping opacity-30" />
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/40 shadow-inner" />

          {/* SVG Healthcare Chart Graphic */}
          <svg
            className="w-full h-full relative z-10 drop-shadow-md"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Clipboard / Patient Chart Body */}
            <rect
              x="50"
              y="30"
              width="100"
              height="115"
              rx="12"
              fill="var(--color-surface-alt)"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
            />
            {/* Clipboard Clip */}
            <rect
              x="75"
              y="22"
              width="50"
              height="14"
              rx="6"
              fill="var(--color-primary)"
            />
            <circle cx="100" cy="29" r="3" fill="var(--color-white)" />

            {/* Medical Cross on Header */}
            <path
              d="M100 48 V62 M93 55 H107"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Heartbeat ECG Line */}
            <path
              d="M62 82 H80 L86 70 L93 94 L101 75 L106 82 H138"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />

            {/* Placeholder Chart Lines */}
            <rect
              x="65"
              y="105"
              width="70"
              height="4"
              rx="2"
              fill="var(--color-text-secondary)"
              opacity="0.3"
            />
            <rect
              x="65"
              y="117"
              width="45"
              height="4"
              rx="2"
              fill="var(--color-text-secondary)"
              opacity="0.3"
            />

            {/* Stethoscope / Search Magnifier on Bottom Right */}
            <g transform="translate(118, 92)">
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="var(--color-surface)"
                stroke="var(--color-primary)"
                strokeWidth="3"
              />
              <path
                d="M37 37 L50 50"
                stroke="var(--color-primary)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Question mark inside magnifier */}
              <text
                x="24"
                y="30"
                textAnchor="middle"
                fill="var(--color-primary)"
                fontSize="18"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                ?
              </text>
            </g>
          </svg>
        </div>

        {/* Headings */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight mt-4">
          Resource Not Found
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-lg leading-relaxed">
          The requested record, scheduled event, or system module may have been moved, completed, or is unavailable at this address.
        </p>

        {/* Operational Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 my-6 text-xs text-[var(--color-text-secondary)] font-medium">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/30">
            <RiShieldCrossLine className="text-[var(--color-primary)] text-sm" />
            <span>Secure Patient Data Guard</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Button
            variant="contained"
            onClick={() => navigate(dashboardRoute)}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              borderRadius: "var(--radius-lg)",
              py: 1.1,
              px: 3.5,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.875rem",
              boxShadow: "var(--shadow-md)",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                backgroundColor: "var(--color-primary)",
                opacity: 0.9,
              },
            }}
          >
            <FaClinicMedical className="text-base" />
            <span>Return to Dashboard</span>
          </Button>

          <Button
            variant="outlined"
            onClick={handleGoBack}
            sx={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              borderRadius: "var(--radius-lg)",
              py: 1.1,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                borderColor: "var(--color-primary)",
                backgroundColor: "var(--color-surface)",
              },
            }}
          >
            <FaArrowLeft className="text-sm" />
            <span>Back to Previous Page</span>
          </Button>
        </div>

        {/* Footer Support Prompt */}
        <p className="mt-8 text-xs text-[var(--color-text-secondary)] flex items-center justify-center gap-1.5">
          <FaHeadset className="text-[var(--color-primary)]" />
          <span>Need assistance? Contact your respective administrator.</span>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;

