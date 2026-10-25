import React from "react";
import ScienceIcon from "@mui/icons-material/Science";
import { FaClinicMedical } from "react-icons/fa";
import { Phone, Mail, MapPin, Building2, Sparkles } from "lucide-react";
import AvatarWithStatus from "../../components/common/AvatarWithStatus";

interface PartnerItem {
  id: number;
  clinic_lab_id?: number;
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  consultation_fees?: number;
  fees_duration?: number;
  is_active: "0" | "1" | boolean | number;
}

interface Props {
  title: string;
  countLabel: string;
  emptyText: string;
  clinicId: number | null;
  data: PartnerItem[];
  onToggleStatus?: (item: PartnerItem) => void;
  updatingId?: number | null;
}

const ViewPartnerUI = ({
  title,
  countLabel,
  emptyText,
  data,
  onToggleStatus,
  updatingId,
}: Props) => {
  return (
    <div className="w-full space-y-3.5">
      {/* Subheader summary bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              <Sparkles className="w-3 h-3 text-[var(--color-primary)]" />
              {data?.length ?? 0} Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {data?.length ?? 0} {countLabel}
          </p>
        </div>
      </div>

      {/* Empty State */}
      {!data?.length && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center mx-auto shadow-2xs">
            <Building2 className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{emptyText}</p>
        </div>
      )}

      {/* Connected Partner Cards Grid */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          {data.map((item) => {
            const isActive =
              item.is_active === "1" ||
              item.is_active === true ||
              item.is_active === 1;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Top: Gradient Banner */}
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white p-3.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      <AvatarWithStatus
                        image={item.logo}
                        alt={item.name}
                        isActive={isActive ? "1" : "0"}
                        showStatus={true}
                        size={38}
                        fallbackIcon={
                          title.toLowerCase().includes("lab")
                            ? ScienceIcon
                            : FaClinicMedical
                        }
                      />
                    </div>
                    <h3
                      className="font-bold text-sm text-white truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                  </div>

                  {/* Clean Minimal Status Toggle Button */}
                  {onToggleStatus && (
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => onToggleStatus(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/95 text-slate-800 shadow-2xs transition-all cursor-pointer shrink-0 select-none ${
                        updatingId === item.id
                          ? "opacity-60 cursor-wait"
                          : "hover:bg-white hover:shadow-xs"
                      }`}
                      title={`Click to ${isActive ? "deactivate" : "activate"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isActive
                            ? "bg-emerald-500 ring-2 ring-emerald-200"
                            : "bg-slate-400"
                        }`}
                      />
                      <span
                        className={
                          isActive
                            ? "text-emerald-700 font-bold"
                            : "text-slate-600"
                        }
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Card Body: Contact Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="space-y-2.5">
                    {item.phone && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-slate-700 truncate">
                          {item.phone}
                        </span>
                      </div>
                    )}

                    {item.email && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span
                          className="text-slate-600 truncate"
                          title={item.email}
                        >
                          {item.email}
                        </span>
                      </div>
                    )}

                    {(item.address || item.city || item.state) && (
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-slate-600 line-clamp-2 leading-relaxed">
                          {[item.address, item.city, item.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Consultation fees & duration if available */}
                  {(item.consultation_fees !== undefined ||
                    item.fees_duration !== undefined) && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                      {item.consultation_fees !== undefined && (
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] px-2.5 py-1 rounded-lg">
                          ₹{item.consultation_fees} Fee
                        </span>
                      )}
                      {item.fees_duration !== undefined && (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-lg text-[11px]">
                          {item.fees_duration}{" "}
                          {item.fees_duration === 1 ? "Day" : "Days"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewPartnerUI;
