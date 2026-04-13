import ScienceIcon from "@mui/icons-material/Science";
import { styled, Switch } from "@mui/material";
import { FaClinicMedical, FaUserMd } from "react-icons/fa";
import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdCurrencyRupee,
  MdCalendarToday,
} from "react-icons/md";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  consultation_fees?: number;
  fees_duration?: number;
  is_active: "0" | "1";
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

const MiniSwitch = styled(Switch)(() => ({
  width: 32,
  height: 18,
  padding: 0,
  display: "flex",
  alignItems: "center",

  "& .MuiSwitch-switchBase": {
    padding: 2,
    transitionDuration: "200ms",

    "&.Mui-checked": {
      transform: "translateX(14px)",
      color: "var(--color-surface-alt)",

      "& + .MuiSwitch-track": {
        backgroundColor: "var(--color-success)",
        opacity: 1,
        border: 0,
      },
    },
  },

  "& .MuiSwitch-thumb": {
    width: 14,
    height: 14,
    boxShadow: "var(--shadow-sm)",
  },

  "& .MuiSwitch-track": {
    borderRadius: 9,
    backgroundColor: "var(--color-error)",
    opacity: 1,
  },
}));

const ViewPartnerUI = ({
  title,
  countLabel,
  emptyText,
  data,
  onToggleStatus,
  updatingId,
}: Props) => {
  return (
    <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)]">
      <div className="mb-6">
        <h2
          className="text-[var(--color-primary)] font-[var(--font-weight-bold)]"
          style={{ fontSize: "var(--font-h4)" }}
        >
          {title}
        </h2>

        <p
          className="text-[var(--color-text)] opacity-70"
          style={{ fontSize: "var(--font-sx)" }}
        >
          {data?.length} {countLabel}
        </p>
      </div>

      {!data?.length && (
        <p
          className="text-[var(--color-text)] opacity-70"
          style={{ fontSize: "var(--font-sx)" }}
        >
          {emptyText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {data?.map((item) => (
          <div
            key={item.id}
            className="w-72 flex flex-col rounded-[var(--radius-lg)] overflow-hidden
               shadow-[var(--shadow-md)]
               bg-[var(--color-bg)]
               transition-all duration-300
               hover:shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-primary)] text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-surface)] border border-white shadow-sm overflow-hidden shrink-0">
                  {item.logo ? (
                    <img
                      src={`data:image/png;base64,${item.logo}`}
                      alt={item.name}
                      className="w-full h-full object-fill rounded-2xl"
                    />
                  ) : title === "Registered Labs" ? (
                    <ScienceIcon className="text-[var(--color-primary)]" />
                  ) : title === "Registered Doctors" ? (
                    <FaUserMd className="text-[var(--color-primary)]" />
                  ) : (
                    <FaClinicMedical className="text-[var(--color-primary)]" />
                  )}
                </div>

                <h3 className="font-semibold text-sm truncate">{item.name}</h3>
              </div>

              {onToggleStatus && (
                <div
                  className="
    flex items-center gap-2
    px-2 py-1 rounded-[var(--radius-lg)] 
    border bg-[var(--color-surface-alt)]
    shadow-[var(--shadow-md)]
    text-[var(--color-primary)]
  "
                >
                  <span className="text-[10px] font-semibold leading-none">
                    {item.is_active === "1" ? "Active" : "Inactive"}
                  </span>

                  <MiniSwitch
                    checked={item.is_active === "1"}
                    disabled={updatingId === item.id}
                    onChange={() => onToggleStatus(item)}
                  />
                </div>
              )}
            </div>
            <div
              className="px-4 py-3 flex flex-col h-full text-xs
                    text-[var(--color-text-secondary)]
                    bg-[var(--color-surface-alt)]"
            >
              <div className="space-y-3">
                {item.phone && (
                  <div className="flex items-center gap-2">
                    <MdPhone className="text-[var(--color-primary)] text-sm shrink-0" />
                    <span className="truncate">{item.phone}</span>
                  </div>
                )}

                {item.email && (
                  <div className="flex items-center gap-2">
                    <MdEmail className="text-[var(--color-primary)] text-sm shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                )}

                {item.address && (
                  <div className="flex items-start gap-2">
                    <MdLocationOn className="text-[var(--color-primary)] text-sm mt-0.5 shrink-0" />
                    <span className="leading-relaxed">
                      {[item.address, item.city, item.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {(item.consultation_fees !== undefined ||
                item.fees_duration !== undefined) && (
                <div className="flex justify-between items-center mt-auto pt-3">
                  {item.consultation_fees !== undefined && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium">
                      <MdCurrencyRupee className="text-sm" />
                      {item.consultation_fees} Fee
                    </div>
                  )}

                  {item.fees_duration !== undefined && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium">
                      <MdCalendarToday className="text-sm" />
                      <span>
                        {item.fees_duration}{" "}
                        {item.fees_duration === 1 ? "Day" : "Days"} Validity
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewPartnerUI;
