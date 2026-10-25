import React, { useEffect, useState, useMemo } from "react";
import {
  Tag,
  Ticket,
  Edit,
  Copy,
  Check,
  Search,
  PlusCircle,
  Sparkles,
  Percent,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../services/EmrApi";
import { getPromotionalOffersApi } from "../../api";
import type { PromotionalOffer } from "../../types/types";
import { getSession } from "../../context/sessions/userSession";

interface PromotionalOffersProps {
  onEdit: (offer: PromotionalOffer) => void;
  onAddNew?: () => void;
}

const PromotionalOffers: React.FC<PromotionalOffersProps> = ({
  onEdit,
  onAddNew,
}) => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const navigate = useNavigate();
  const user = getSession("user");

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError("");

      const centerId =
        user?.entity_type === 1
          ? user?.clinic_id
          : user?.entity_type === 2
            ? user?.lab_id
            : user?.clinic_id || user?.lab_id;

      const centerType =
        user?.entity_type === 1
          ? "clinic"
          : user?.entity_type === 2
            ? "lab"
            : user?.clinic_id
              ? "clinic"
              : "lab";

      if (!centerId || !centerType) {
        setOffers([]);
        setError("Unable to identify the logged-in clinic or lab establishment.");
        return;
      }

      const response = await getPromotionalOffersApi(centerId, centerType);

      if (response.success && Array.isArray(response.data)) {
        setOffers(response.data);
      } else {
        setOffers([]);
        setError("Unable to load promotional offers. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching promotional offers:", err);
      setOffers([]);
      setError("Unable to load promotional offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleEdit = (offer: PromotionalOffer) => {
    if (onEdit) {
      onEdit(offer);
    } else {
      const targetRoute = user?.entity_type === 2 ? "/lab/offers" : "/clinic/offers";
      navigate(targetRoute, {
        state: {
          offer,
          isEdit: true,
        },
      });
    }
  };

  const handleCopyCoupon = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCoupon(code);
      toast.success(`Coupon code ${code} copied!`);
      setTimeout(() => setCopiedCoupon(null), 2500);
    });
  };

  const getImageUrl = (offer: PromotionalOffer) => {
    if (!offer.offer_image_guid) return "";
    return `${BASE_URL}/patient/patients/offer-images/${offer.offer_image_guid}`;
  };

  const formatValidTill = (dateStr?: string) => {
    if (!dateStr) return "Ongoing";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const isActive = Number(offer.is_active ?? 1) === 1;
      if (filterStatus === "active" && !isActive) return false;
      if (filterStatus === "inactive" && isActive) return false;

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const titleMatch = (offer.offer_title || "").toLowerCase().includes(query);
        const codeMatch = (offer.coupon_code || "").toLowerCase().includes(query);
        const descMatch = (offer.offer_description || "").toLowerCase().includes(query);
        return titleMatch || codeMatch || descMatch;
      }

      return true;
    });
  }, [offers, filterStatus, search]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[300px] gap-2.5">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">
          Loading promotional offers...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3.5">
      {/* =====================================================
          CONTROL BAR: SEARCH & STATUS FILTERS
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Promotional Offers
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Tag className="w-3 h-3 text-[var(--color-primary)]" />
            {filteredOffers.length} {filteredOffers.length === 1 ? "Offer" : "Offers"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offer or coupon..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 transition"
            />
          </div>

          {/* Status Segmented Pill */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            {(
              [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "inactive", label: "Inactive" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterStatus === st.id
                    ? "bg-white text-[var(--color-primary)] shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchOffers}
            title="Refresh list"
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOffers}
            className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* EMPTY OFFERS STATE */}
      {!error && filteredOffers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 sm:p-12 text-center max-w-xl mx-auto my-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
          </div>

          <h3 className="text-base font-bold text-slate-900">
            {offers.length === 0
              ? "No Promotional Offers Created Yet"
              : "No Offers Match Your Filter"}
          </h3>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {offers.length === 0
              ? "Attract and reward patients with seasonal healthcare checkup discounts, packages, and coupon deals."
              : "Try refining your search keyword or switching between Active and Inactive filters."}
          </p>

          {onAddNew && offers.length === 0 && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-2xs transition cursor-pointer mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Offer</span>
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          OFFER CARDS GRID - PATIENT VOUCHER DESIGN (MATCHING IMAGE 2)
      ====================================================== */}
      {!error && filteredOffers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredOffers.map((offer) => {
            const imageUrl = getImageUrl(offer);
            const isImageFailed = failedImages[offer.offer_id] || !imageUrl;
            const isActive = Number(offer.is_active ?? 1) === 1;

            return (
              <div
                key={offer.offer_id}
                className="relative rounded-2xl overflow-hidden min-h-[220px] p-5 flex flex-col justify-between bg-slate-900 border border-slate-800 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group"
              >
                {/* Background Image with Dark Cinematic Gradient Overlay */}
                {!isImageFailed ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={offer.offer_title}
                      className="hidden"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [offer.offer_id]: true,
                        }))
                      }
                    />
                    {/* Gradient Overlay for high readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[var(--color-primary)]/15 blur-2xl pointer-events-none" />
                    <Percent className="absolute right-4 bottom-4 w-28 h-28 text-white/[0.04] pointer-events-none" />
                  </div>
                )}

                {/* Top Row: Center Pill & Validity / Status */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white tracking-wide truncate max-w-[170px] shadow-2xs">
                    {offer.center_name || user?.full_name || "TrueHeal Clinic"}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90 font-medium shrink-0">
                      Valid till: {formatValidTill(offer.end_date)}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? "bg-emerald-400 ring-2 ring-emerald-400/40" : "bg-slate-400"
                      }`}
                      title={isActive ? "Active campaign" : "Inactive campaign"}
                    />
                  </div>
                </div>

                {/* Middle Row: Title, Big Yellow Discount, Description */}
                <div className="relative z-10 my-3 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-1">
                    {offer.offer_title}
                  </h3>

                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight leading-none drop-shadow-xs">
                    {offer.discount_percentage}% OFF
                  </div>

                  <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed pt-0.5">
                    {offer.offer_description}
                  </p>
                </div>

                {/* Bottom Row: Coupon Pill (Left) & Edit Button (Right) */}
                <div className="relative z-10 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  {/* Coupon Code Pill */}
                  {offer.coupon_code ? (
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoupon(offer.coupon_code!, e)}
                      title="Click to copy coupon code"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/30 bg-black/40 backdrop-blur-sm text-xs font-bold text-white tracking-wider hover:border-amber-400 hover:text-amber-300 transition cursor-pointer select-none group/cpn"
                    >
                      <Ticket className="w-3.5 h-3.5 text-amber-400 group-hover/cpn:rotate-12 transition-transform" />
                      <span>{offer.coupon_code}</span>
                      {copiedCoupon === offer.coupon_code ? (
                        <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                      ) : (
                        <Copy className="w-3 h-3 text-white/60 ml-0.5 group-hover/cpn:text-white" />
                      )}
                    </button>
                  ) : (
                    <div />
                  )}

                  {/* Edit Action Button (Styled like Claim Now in Image 2) */}
                  <button
                    type="button"
                    onClick={() => handleEdit(offer)}
                    className="px-4 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-700" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromotionalOffers;
