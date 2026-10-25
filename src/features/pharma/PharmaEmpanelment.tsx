import { useEffect, useState, useRef, useCallback } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import { getSessionItem } from "../../context/sessions/userSession";
import { Pill, Sparkles, Layers, PlusCircle } from "lucide-react";
import { getActivePharmaListApi } from "../../api/pharmacyApi/PharmacyApi";
import {
  getMappedPharmaciesApi,
  mapClinicPartnersApi,
  updatePharmaStatus,
} from "../../api/clinic/ClinicEmpanelmentApis";
import type { PharmaApiItem } from "../../types/pharmacyType/pharmacyInterfaceType";
import { toast } from "react-toastify";

const PharmaEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [pharmas, setPharmas] = useState<PharmaApiItem[]>([]);
  const [mappedPharmas, setMappedPharmas] = useState<PharmaApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const clinicId = getSessionItem("user", "clinic_id");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const fetchPharmas = async (
    search?: string,
    coords: { latitude: number; longitude: number } | null = userLocationRef.current,
  ) => {
    try {
      setLoading(true);
      const payload: {
        search?: string;
        latitude?: number;
        longitude?: number;
      } = {};
      if (search && search.trim()) payload.search = search.trim();
      if (coords) {
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      }
      const res: any = await getActivePharmaListApi(payload);
      setPharmas(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error("Pharma list error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    fetchPharmas(text, userLocationRef.current);
  }, []);

  const fetchPharmaByClinicId = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await getMappedPharmaciesApi(clinicId, null);
      setMappedPharmas(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mappedIds = new Set(mappedPharmas.map((p) => p.pharma_id));

  // Initial page load: fetch location and default pharmacies
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(coords);
          fetchPharmas("", coords);
        },
        (err) => {
          console.warn("Location error:", err);
          fetchPharmas("", null);
        },
      );
    } else {
      fetchPharmas("", null);
    }
  }, []);

  useEffect(() => {
    fetchPharmaByClinicId();
  }, [clinicId]);

  const handleSubmitPharma = async (ids: number[]) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    const existingIds = mappedPharmas.map((p) => p.pharma_id);
    const duplicates = ids.filter((id) => existingIds.includes(id));

    if (duplicates.length) {
      toast.warning("Some selected pharmacies are already registered.");
      return;
    }

    try {
      setLoading(true);
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids: [],
        pharmacy_ids: ids,
      });
      toast.success("Pharmacy Added Successfully.");
      await fetchPharmaByClinicId();
      setActiveTab("view");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Pharmacy already registered.");
      } else {
        toast.error("Failed to map pharmacy.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewItems = mappedPharmas?.map((p) => ({
    id: p.pharma_id,
    name: p.pharma_name,
    logo: p.pharma_logo,
    phone: p.phone,
    email: p.email,
    address: p.address,
    city: p.city,
    state: p.state,
    is_active: p.is_active,
  }));

  const handlePharmaStatus = async (item: any) => {
    const isActive = item.is_active === "1";
    const previousStatus = item.is_active;

    setUpdatingId(item.id);

    setMappedPharmas((prev) =>
      prev.map((p) =>
        p.pharma_id === item.id
          ? { ...p, is_active: isActive ? "0" : "1" }
          : p,
      ),
    );

    try {
      await updatePharmaStatus({
        clinic_id: clinicId,
        pharma_id: item.id,
        is_active: !isActive,
      });
      toast.success(isActive ? "Pharmacy Deactivated" : "Pharmacy Activated");
    } catch (error: any) {
      setMappedPharmas((prev) =>
        prev.map((p) =>
          p.pharma_id === item.id ? { ...p, is_active: previousStatus } : p,
        ),
      );
      toast.error(
        error?.response?.data?.message || "Failed to update pharmacy status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)]  space-y-3">
      {/* =====================================================
          HEADER & TAB CONTROLS (RESPONSIVE - OFFERS TABS STYLE)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Branding & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs shrink-0">
              <Pill className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Pharmacy Empanelment
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  Pharmacy Network
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                Manage affiliated partner pharmacies and dispensary connections for your clinic.
              </p>
            </div>
          </div>

          {/* Right: Modern Responsive Segmented Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "view"}
              onClick={() => setActiveTab("view")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "view"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>View</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "add"}
              onClick={() => setActiveTab("add")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "add"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          TAB CONTENT PANEL
      ====================================================== */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">
            Loading pharmacies...
          </span>
        </div>
      ) : (
        <div className="transition-all duration-150">
          {activeTab === "view" && (
            <ViewPartnerUI
              title="Registered Pharmacies"
              countLabel="pharmacies connected to your clinic"
              emptyText="No pharmacies mapped yet. Switch to the 'Add' tab to connect retail and hospital pharmacies."
              clinicId={clinicId}
              data={viewItems}
              onToggleStatus={handlePharmaStatus}
              updatingId={updatingId}
            />
          )}

          {activeTab === "add" && (
            <AddPartnerUI
              data={pharmas.map((p) => ({
                id: p.pharma_id,
                name: p.pharma_name,
                logo: p.pharma_logo,
                email: p.email,
                mobile: p.phone,
                address: p.address,
                city: p.city,
                state: p.state,
                alreadyMapped: mappedIds.has(p.pharma_id),
                distance_km: p.distance_km,
              }))}
              icon={<LocalPharmacyIcon className="text-[var(--color-primary)]" />}
              placeholder="Search pharmacy by name, city..."
              buttonText="Map Selected Pharmacy"
              onSubmit={handleSubmitPharma}
              onSearchChange={handleSearchChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PharmaEmpanelment;
