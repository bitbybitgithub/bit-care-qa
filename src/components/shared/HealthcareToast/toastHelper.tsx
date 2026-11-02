import React from "react";
import {
  toast,
  type ToastOptions,
  type TypeOptions,
  type Id,
  type ToastContent,
} from "react-toastify";
import {
  HeartPulse,
  FlaskConical,
  Pill,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { StructuredToastContent } from "./HealthcareToast";

/* ------------------------------------------------------------------
   Production-Grade Clinical Toast Helper Utility (showToast)
   ------------------------------------------------------------------ */
export type ToastInput =
  | React.ReactNode
  | { title?: string; message: React.ReactNode; badge?: string };

export const createToastContent = (
  input: unknown,
  type: TypeOptions
): ToastContent => {
  if (React.isValidElement(input) || typeof input === "function") {
    return input as ToastContent;
  }
  if (
    input &&
    typeof input === "object" &&
    "message" in (input as Record<string, unknown>)
  ) {
    const obj = input as {
      title?: string;
      message: React.ReactNode;
      badge?: string;
    };
    return (
      <StructuredToastContent
        title={obj.title}
        description={obj.message}
        badge={obj.badge}
        type={type}
      />
    );
  }

  return (
    <StructuredToastContent
      description={input as React.ReactNode}
      type={type}
    />
  );
};

/* ------------------------------------------------------------------
   Global Interceptor: Upgrades all 270+ existing toast calls across
   the codebase to the clinical structured UI automatically
   ------------------------------------------------------------------ */
interface PatchedToast {
  __healthcarePatched?: boolean;
}

export const installHealthcareToastInterceptors = () => {
  const target = toast as typeof toast & PatchedToast;
  if (target.__healthcarePatched) return;

  const originalSuccess = target.success.bind(target);
  const originalError = target.error.bind(target);
  const originalWarning = target.warning.bind(target);
  const originalWarn = target.warn.bind(target);
  const originalInfo = target.info.bind(target);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target.success = (content: any, options?: ToastOptions): Id => {
    return originalSuccess(createToastContent(content, "success"), options);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target.error = (content: any, options?: ToastOptions): Id => {
    return originalError(createToastContent(content, "error"), options);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target.warning = (content: any, options?: ToastOptions): Id => {
    return originalWarning(createToastContent(content, "warning"), options);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target.warn = (content: any, options?: ToastOptions): Id => {
    return originalWarn(createToastContent(content, "warning"), options);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target.info = (content: any, options?: ToastOptions): Id => {
    return originalInfo(createToastContent(content, "info"), options);
  };

  target.__healthcarePatched = true;
};

// Install immediately when imported
installHealthcareToastInterceptors();

export const showToast = {
  success: (input: ToastInput, options?: ToastOptions) => {
    return toast.success(createToastContent(input, "success"), options);
  },

  error: (input: ToastInput, options?: ToastOptions) => {
    return toast.error(createToastContent(input, "error"), options);
  },

  warning: (input: ToastInput, options?: ToastOptions) => {
    return toast.warning(createToastContent(input, "warning"), options);
  },

  info: (input: ToastInput, options?: ToastOptions) => {
    return toast.info(createToastContent(input, "info"), options);
  },

  // Specialized Healthcare Notifications
  patientAssigned: (
    patientName: string,
    doctorName?: string,
    options?: ToastOptions
  ) => {
    return toast.info(
      <div className="healthcare-toast-content">
        <div className="healthcare-toast-header">
          <span className="healthcare-toast-title">
            <HeartPulse size={14} className="text-sky-600 animate-pulse" />
            Patient Ready for Consultation
          </span>
          <span className="healthcare-toast-badge healthcare-toast-badge--info">
            EMR Queue
          </span>
        </div>
        <div className="healthcare-toast-desc">
          <strong>{patientName}</strong> is ready with vitals recorded
          {doctorName ? ` for Dr. ${doctorName}` : ""}.
        </div>
      </div>,
      {
        icon: (
          <div className="healthcare-toast-icon-wrap healthcare-toast-icon-wrap--info">
            <HeartPulse size={16} strokeWidth={2.2} />
          </div>
        ),
        ...options,
      }
    );
  },

  appointmentCreated: (
    patientName: string,
    time?: string,
    options?: ToastOptions
  ) => {
    return toast.success(
      <div className="healthcare-toast-content">
        <div className="healthcare-toast-header">
          <span className="healthcare-toast-title">
            <CalendarCheck size={14} className="text-emerald-600" />
            New Appointment Booked
          </span>
          <span className="healthcare-toast-badge healthcare-toast-badge--success">
            Booked
          </span>
        </div>
        <div className="healthcare-toast-desc">
          Appointment confirmed for <strong>{patientName}</strong>
          {time ? ` at ${time}` : ""}.
        </div>
      </div>,
      {
        icon: (
          <div className="healthcare-toast-icon-wrap healthcare-toast-icon-wrap--success">
            <ShieldCheck size={16} strokeWidth={2.2} />
          </div>
        ),
        ...options,
      }
    );
  },

  labReferral: (
    patientName: string,
    message?: string,
    options?: ToastOptions
  ) => {
    return toast.info(
      <div className="healthcare-toast-content">
        <div className="healthcare-toast-header">
          <span className="healthcare-toast-title">
            <FlaskConical size={14} className="text-sky-600" />
            New Lab Investigation
          </span>
          <span className="healthcare-toast-badge healthcare-toast-badge--info">
            LAB
          </span>
        </div>
        <div className="healthcare-toast-desc">
          {message || `New lab referral received for ${patientName}`}.
        </div>
      </div>,
      {
        icon: (
          <div className="healthcare-toast-icon-wrap healthcare-toast-icon-wrap--info">
            <FlaskConical size={16} strokeWidth={2.2} />
          </div>
        ),
        ...options,
      }
    );
  },

  pharmaReferral: (message?: string, options?: ToastOptions) => {
    return toast.info(
      <div className="healthcare-toast-content">
        <div className="healthcare-toast-header">
          <span className="healthcare-toast-title">
            <Pill size={14} className="text-sky-600" />
            Pharmacy Prescription
          </span>
          <span className="healthcare-toast-badge healthcare-toast-badge--info">
            PHARMA
          </span>
        </div>
        <div className="healthcare-toast-desc">
          {message || "New prescription received for dispensing"}.
        </div>
      </div>,
      {
        icon: (
          <div className="healthcare-toast-icon-wrap healthcare-toast-icon-wrap--info">
            <Pill size={16} strokeWidth={2.2} />
          </div>
        ),
        ...options,
      }
    );
  },
};
