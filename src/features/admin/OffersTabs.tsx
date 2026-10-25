import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Tag, PlusCircle, Layers, Sparkles, RefreshCw } from "lucide-react";
import OffersDiscount from "./OffersDiscount";
import PromotionalOffers from "./PromotionalOffers";
import type { PromotionalOffer } from "../../types/types";

const OffersTabs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"add" | "view">(
    tabParam === "view" ? "view" : "add",
  );
  const [editingOffer, setEditingOffer] = useState<PromotionalOffer | null>(
    null,
  );

  useEffect(() => {
    if (location.state?.isEdit && location.state?.offer) {
      setEditingOffer(location.state.offer);
      setActiveTab("add");
    }
  }, [location.state]);

  const handleTabChange = (tab: "add" | "view") => {
    setActiveTab(tab);
    setSearchParams(tab === "view" ? { tab: "view" } : {});
    if (tab === "view") {
      setEditingOffer(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-slate-50/60  space-y-3">
      {/* =====================================================
          ADMIN HEADER & TAB CONTROLS (RESPONSIVE)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Branding & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs shrink-0">
              <Tag className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Promotional Offers & Discounts
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  Campaign Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                Create and manage promotional campaigns, discount coupons, and special deals for patients.
              </p>
            </div>
          </div>

          {/* Right: Modern Responsive Segmented Tabs (Add/Update first, View second) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "add"}
              onClick={() => handleTabChange("add")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "add"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {editingOffer ? (
                <RefreshCw className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              )}
              <span>{editingOffer ? "Update" : "Add"}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "view"}
              onClick={() => handleTabChange("view")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "view"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>View</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          TAB CONTENT PANEL
      ====================================================== */}
      <div className="transition-all duration-150">
        {activeTab === "add" && (
          <OffersDiscount
            initialOffer={editingOffer}
            isEditMode={!!editingOffer}
            onSuccess={() => {
              setEditingOffer(null);
              setActiveTab("view");
              setSearchParams({ tab: "view" });
            }}
            onCancel={() => {
              setEditingOffer(null);
              setActiveTab("view");
              setSearchParams({ tab: "view" });
            }}
          />
        )}

        {activeTab === "view" && (
          <PromotionalOffers
            onEdit={(offer: PromotionalOffer) => {
              setEditingOffer(offer);
              setActiveTab("add");
            }}
            onAddNew={() => {
              setEditingOffer(null);
              setActiveTab("add");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OffersTabs;
