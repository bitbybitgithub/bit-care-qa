import React from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Button } from "@mui/material";
import {
  FaRedo,
  FaClinicMedical,
  FaCopy,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaHeartbeat,
} from "react-icons/fa";
import {  RiPulseLine } from "react-icons/ri";
import { LucideShieldAlert } from "lucide-react";

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

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
  incidentId: string;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
      incidentId: `MED-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Clinical ErrorBoundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleNavigateDashboard = () => {
    const route = getFallbackDashboardRoute();
    window.location.href = route;
  };

  handleCopyDetails = () => {
    const { error, errorInfo, incidentId } = this.state;
    const diagnostics = [
      `Incident ID: ${incidentId}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error: ${error?.name}: ${error?.message}`,
      `Component Stack: ${errorInfo?.componentStack || "N/A"}`,
      `Stack Trace: ${error?.stack || "N/A"}`,
    ].join("\n\n");

    navigator.clipboard
      .writeText(diagnostics)
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      })
      .catch((err) => console.error("Could not copy diagnostics", err));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, copied, incidentId } = this.state;

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
          <div className="relative w-full max-w-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-6 sm:p-8 text-center overflow-hidden flex flex-col items-center">
            {/* Ambient Background Glow */}
            <div
              className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-20 blur-3xl"
              style={{ backgroundColor: "var(--color-error)" }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full pointer-events-none opacity-10 blur-3xl"
              style={{ backgroundColor: "var(--color-primary)" }}
            />

            {/* Medical Alert Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold tracking-wide uppercase mb-5 animate-fadeIn">
              <LucideShieldAlert  className="text-sm animate-pulse" />
              <span>Clinical System Interrupt • Safe Mode</span>
            </div>

            {/* Healthcare Diagnostic Pulse Icon */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-3xl sm:text-4xl shadow-inner ring-8 ring-rose-500/5">
                <FaHeartbeat className="animate-pulse" />
              </div>
            </div>

            {/* Headings */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tracking-tight mt-4">
              Clinical Workspace Encountered an Issue
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed">
              An unexpected runtime exception was intercepted in the healthcare
              interface. Patient databases and saved records remain secure.
            </p>

            {/* Patient Safety Guarantee Box */}
            <div className="my-5 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)]/30 bg-[var(--color-surface)] p-3 text-xs text-[var(--color-text-secondary)] flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2 min-w-0">
                <RiPulseLine className="text-[var(--color-primary)] text-base shrink-0" />
                <span className="truncate">
                  Data Protection: Active Session Protected
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--color-primary)] px-2 py-0.5 rounded bg-[var(--color-surface-alt)] border border-[var(--color-border)]/30">
                Ref: {incidentId}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <Button
                variant="contained"
                onClick={this.handleReload}
                sx={{
                  backgroundColor: "var(--color-primary)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-lg)",
                  py: 1,
                  px: 3,
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
                <FaRedo className="text-sm" />
                <span>Reload Medical Workspace</span>
              </Button>

              <Button
                variant="outlined"
                onClick={this.handleNavigateDashboard}
                sx={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  borderRadius: "var(--radius-lg)",
                  py: 1,
                  px: 2.5,
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
                <FaClinicMedical className="text-sm" />
                <span>Return to Dashboard</span>
              </Button>
            </div>

            {/* Collapsible Technical Diagnostics */}
            <div className="w-full mt-6 pt-4 border-t border-[var(--color-border)]/20 text-left">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    this.setState((prev) => ({
                      showDetails: !prev.showDetails,
                    }))
                  }
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition cursor-pointer"
                >
                  <span>Technical Diagnostics for IT Support</span>
                  {showDetails ? (
                    <FaChevronUp className="text-[10px]" />
                  ) : (
                    <FaChevronDown className="text-[10px]" />
                  )}
                </button>

                {showDetails && (
                  <button
                    type="button"
                    onClick={this.handleCopyDetails}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <FaCheck className="text-emerald-500 text-xs" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <FaCopy className="text-xs" />
                        <span>Copy Diagnostic Log</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {showDetails && (
                <div className="mt-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-bg)] border border-[var(--color-border)]/30 text-xs font-mono text-[var(--color-text)] overflow-auto max-h-44 space-y-2 animate-fadeIn">
                  <p className="text-rose-500 font-bold">
                    {error?.name || "Error"}: {error?.message || "Unknown error"}
                  </p>
                  {errorInfo?.componentStack && (
                    <pre className="text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                  {error?.stack && (
                    <pre className="text-[10px] text-[var(--color-text-secondary)]/80 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
