import { useState, useEffect, useRef } from "react";
import ScienceIcon from "@mui/icons-material/Science";
import { FaClinicMedical } from "react-icons/fa";
import {
  Search,
  PlusCircle,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";
import AvatarWithStatus from "../../components/common/AvatarWithStatus";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  email?: string;
  mobile?: string;
  city?: string;
  state?: string;
  address?: string;
  alreadyMapped?: boolean;
  distance_km?: number | null;
}

interface Props {
  data: PartnerItem[];
  icon: React.ReactNode;
  placeholder: string;
  buttonText: string;
  onSubmit: (ids: number[]) => Promise<void>;
  onSearchChange?: (text: string) => void;
}

const AddPartner = ({
  data,
  placeholder,
  buttonText,
  onSubmit,
  onSearchChange,
}: Props) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  const isFirstRender = useRef(true);
  const lastSearchedRef = useRef("");

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // If search is cleared, reset immediately without waiting
    if (search === "") {
      if (lastSearchedRef.current !== "") {
        lastSearchedRef.current = "";
        onSearchChangeRef.current?.("");
      }
      return;
    }

    // Debounce when user is typing, suppressing redundant searches
    const timer = setTimeout(() => {
      const trimmed = search.trim();
      if (trimmed !== lastSearchedRef.current) {
        lastSearchedRef.current = trimmed;
        onSearchChangeRef.current?.(trimmed);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [search]);

  const toggleSelect = (id: number, disabled?: boolean) => {
    if (disabled) return;

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    try {
      setLoading(true);
      await onSubmit(selected);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = onSearchChange
    ? data
    : data.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );

  return (
    <div className="w-full space-y-3.5">
      {/* Top Search & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {selected.length > 0 && (
            <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] px-2.5 py-1 rounded-lg border border-[var(--color-primary)]/20">
              {selected.length} Selected
            </span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selected.length || loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all cursor-pointer ${
              !selected.length || loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-xs"
            }`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>
                  {buttonText} {selected.length > 0 ? `(${selected.length})` : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-12 text-center max-w-md mx-auto my-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center mx-auto shadow-2xs">
            <Building2 className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Partners Found
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {search
              ? `No partners found matching "${search}". Try checking the spelling or searching by city.`
              : "No partners available to connect at this moment."}
          </p>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] rounded-lg transition cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Available Partners Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          {filtered.map((item) => {
            const isSelected = selected.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id, item.alreadyMapped)}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between h-full select-none ${
                  item.alreadyMapped
                    ? "border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed"
                    : isSelected
                      ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 bg-white shadow-md cursor-pointer"
                      : "border-slate-200 bg-white hover:border-[var(--color-primary-light)] hover:shadow-md cursor-pointer"
                }`}
              >
                {/* Card Top: Gradient Header with Selection Checkmark */}
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white p-3.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AvatarWithStatus
                      image={item.logo}
                      alt={item.name}
                      showStatus={false}
                      size={38}
                      fallbackIcon={
                        buttonText.toLowerCase().includes("lab")
                          ? ScienceIcon
                          : FaClinicMedical
                      }
                    />
                    <h3
                      className="font-bold text-sm text-white truncate"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                  </div>

                  {/* Checkbox indicator */}
                  <div className="shrink-0">
                    {item.alreadyMapped ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                        Added
                      </span>
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-white text-[var(--color-primary)] flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/60 hover:border-white transition-colors" />
                    )}
                  </div>
                </div>

                {/* Card Body: Contact Details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3 text-xs text-slate-600 bg-white">
                  <div className="space-y-2.5">
                    {item.mobile && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-slate-700 truncate">
                          {item.mobile}
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

                  {/* Bottom status & distance */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.alreadyMapped
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isSelected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {item.alreadyMapped
                        ? "Already Added"
                        : isSelected
                          ? "Selected"
                          : "Available"}
                    </span>

                    {item.distance_km != null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        📍 {item.distance_km} km away
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddPartner;
