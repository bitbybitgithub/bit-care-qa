import "../../../styles/healthcare-toast.css";
import React from "react";
import {
  ToastContainer,
  Slide,
  type TypeOptions,
} from "react-toastify";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Activity,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------
   1. Clinical Healthcare Custom Toast Icons (Clean & Crisp)
   ------------------------------------------------------------------ */
interface IconProps {
  type: TypeOptions;
  theme?: string;
}

export const HealthcareToastIcon: React.FC<IconProps> = ({ type }) => {
  const actualType = type || "info";
  return (
    <div className={`healthcare-toast-icon-wrap healthcare-toast-icon-wrap--${actualType}`}>
      {actualType === "success" && <CheckCircle2 size={16} strokeWidth={2.2} />}
      {actualType === "error" && <AlertCircle size={16} strokeWidth={2.2} />}
      {actualType === "warning" && <AlertTriangle size={16} strokeWidth={2.2} />}
      {actualType === "info" && <Activity size={16} strokeWidth={2.2} />}
    </div>
  );
};

/* ------------------------------------------------------------------
   2. Clinical Close Button
   ------------------------------------------------------------------ */
interface CloseButtonProps {
  closeToast: (e: React.MouseEvent<HTMLElement>) => void;
}

export const HealthcareToastCloseButton: React.FC<CloseButtonProps> = ({
  closeToast,
}) => (
  <button
    type="button"
    onClick={closeToast}
    aria-label="Close notification"
    className="healthcare-toast-close"
  >
    <X size={14} strokeWidth={2.2} />
  </button>
);

/* ------------------------------------------------------------------
   3. Smart Clinical Toast Message Renderer
   ------------------------------------------------------------------ */
export interface StructuredToastProps {
  title?: string;
  description: React.ReactNode;
  badge?: string;
  type?: TypeOptions;
}

export const StructuredToastContent: React.FC<StructuredToastProps> = ({
  title,
  description,
  badge,
  type = "info",
}) => {
  const resolvedTitle = React.useMemo(() => {
    if (title) return title;
    if (typeof description !== "string") {
      switch (type) {
        case "success":
          return "Success";
        case "error":
          return "Action Failed";
        case "warning":
          return "Clinical Warning";
        default:
          return "Notification";
      }
    }

    const lower = description.toLowerCase();
    if (
      lower.includes("vitals") ||
      lower.includes("bp") ||
      lower.includes("pulse") ||
      lower.includes("temperature")
    ) {
      return "Vitals Recorded";
    }
    if (
      lower.includes("assigned") ||
      lower.includes("assignment") ||
      lower.includes("queue")
    ) {
      return "Patient Assigned";
    }
    if (
      lower.includes("appointment") ||
      lower.includes("booking") ||
      lower.includes("schedule") ||
      lower.includes("slot")
    ) {
      return "Appointment Schedule";
    }
    if (
      lower.includes("lab") ||
      lower.includes("test") ||
      lower.includes("specimen") ||
      lower.includes("sample") ||
      lower.includes("report")
    ) {
      return "Lab Diagnostics";
    }
    if (
      lower.includes("pharma") ||
      lower.includes("medication") ||
      lower.includes("prescription") ||
      lower.includes("drug") ||
      lower.includes("dispense")
    ) {
      return "Pharmacy & Rx";
    }
    if (
      lower.includes("payment") ||
      lower.includes("bill") ||
      lower.includes("invoice") ||
      lower.includes("fee") ||
      lower.includes("refund")
    ) {
      return "Billing & Payment";
    }
    if (
      lower.includes("doctor") ||
      lower.includes("nurse") ||
      lower.includes("empanel") ||
      lower.includes("mapping")
    ) {
      return "Clinical Staff";
    }
    if (lower.includes("patient")) {
      return "Patient Record";
    }
    if (
      lower.includes("setting") ||
      lower.includes("profile") ||
      lower.includes("config")
    ) {
      return "Settings";
    }
    if (
      lower.includes("otp") ||
      lower.includes("login") ||
      lower.includes("auth") ||
      lower.includes("logout") ||
      lower.includes("password")
    ) {
      return "Authentication";
    }
    if (
      lower.includes("upload") ||
      lower.includes("file") ||
      lower.includes("image") ||
      lower.includes("document")
    ) {
      return "File Transfer";
    }
    if (
      lower.includes("delete") ||
      lower.includes("remove") ||
      lower.includes("cancel")
    ) {
      return "Record Removed";
    }

    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Action Failed";
      case "warning":
        return "Clinical Warning";
      default:
        return "Notification";
    }
  }, [title, description, type]);

  const safeDescription =
    description ??
    (type === "error" ? "An unexpected error occurred" : "Operation completed");

  return (
    <div className="healthcare-toast-content">
      <div className="healthcare-toast-header">
        <span className="healthcare-toast-title">
          {resolvedTitle}
        </span>
        {badge && (
          <span className={`healthcare-toast-badge healthcare-toast-badge--${type}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="healthcare-toast-desc">
        {safeDescription}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------
   4. Clinical ToastContainer Component
   ------------------------------------------------------------------ */
export const HealthcareToastContainer: React.FC = () => {
  return (
    <ToastContainer
      position="top-center"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      limit={4}
      transition={Slide}
      icon={(props) => <HealthcareToastIcon type={props.type} theme={props.theme} />}
      closeButton={(props) => (
        <HealthcareToastCloseButton closeToast={props.closeToast} />
      )}
    />
  );
};

export default HealthcareToastContainer;
