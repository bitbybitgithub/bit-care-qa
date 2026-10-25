import { useEffect, useState, useRef, useCallback } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import ScienceIcon from "@mui/icons-material/Science";
import { getSessionItem } from "../../context/sessions/userSession";
import { FlaskConical, Sparkles, Layers, PlusCircle } from "lucide-react";

import {
  getMappedLabsListApi,
  mapClinicPartnersApi,
  updateLabStatus,
} from "../../api/clinic/ClinicEmpanelmentApis";
import type { LabApiItem } from "../../types/labType/LabTestInterfaces";
import { toast } from "react-toastify";
import { getActiveLabListApi } from "../../api";

const LabEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  const [labs, setLabs] = useState<LabApiItem[]>([]);
  const [mappedLabs, setMappedLabs] = useState<LabApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const clinicId = getSessionItem("user", "clinic_id");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const fetchLabs = async (
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
      const res: any = await getActiveLabListApi(payload);
      setLabs(res?.data || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error("Lab list error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    fetchLabs(text, userLocationRef.current);
  }, []);

  const fetchMappedLabByClinicId = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await getMappedLabsListApi(clinicId, null);
      setMappedLabs(res.data || []);
    } catch (err) {
      console.error("Lab list error", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial page load: fetch location and default labs
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setUserLocation(coords);
          fetchLabs("", coords);
        },
        (err) => {
          console.warn("Location error:", err);
          fetchLabs("", null);
        },
      );
    } else {
      fetchLabs("", null);
    }
  }, []);

  useEffect(() => {
    fetchMappedLabByClinicId();
  }, [clinicId]);

  const handleSubmitLabs = async (ids: number[]) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    const existingIds = mappedLabs.map((l) => l.lab_id);
    const duplicates = ids.filter((id) => existingIds.includes(id));

    if (duplicates.length) {
      toast.warning("Some selected labs are already registered.");
      return;
    }

    try {
      setLoading(true);
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids: ids,
        pharmacy_ids: [],
      });

      toast.success("Lab Added Successfully.");
      await fetchMappedLabByClinicId();
      setActiveTab("view");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Lab already registered.");
      } else {
        toast.error("Failed to map labs.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mappedLabIds = new Set(mappedLabs.map((l) => l.lab_id));

  const viewItems = mappedLabs?.map((l) => ({
    clinic_lab_id: l.clinic_lab_id,
    id: l.lab_id,
    name: l.lab_name,
    logo: l.lab_logo,
    phone: l.phone,
    email: l.email,
    address: l.address,
    city: l.city,
    state: l.state,
    is_active: l.is_active,
  }));

  const handleLabStatus = async (item: any) => {
    const isActive = item.is_active === "1";
    const previousValue = item.is_active;

    setUpdatingId(item.id);

    setMappedLabs((prev) =>
      prev.map((l) =>
        l.lab_id === item.id ? { ...l, is_active: isActive ? "0" : "1" } : l,
      ),
    );

    try {
      await updateLabStatus({
        clinic_id: clinicId,
        lab_id: item.id,
        is_active: !isActive,
      });
      toast.success(isActive ? "Lab Deactivated" : "Lab Activated");
    } catch (error: any) {
      setMappedLabs((prev) =>
        prev.map((l) =>
          l.lab_id === item.id ? { ...l, is_active: previousValue } : l,
        ),
      );
      toast.error(
        error?.response?.data?.message || "Failed to update lab status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] space-y-3">
      {/* =====================================================
          HEADER & TAB CONTROLS (RESPONSIVE - OFFERS TABS STYLE)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Branding & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs shrink-0">
              <FlaskConical className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Lab Empanelment
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  Diagnostic Network
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                Manage diagnostic laboratories and partner affiliations connected to your clinic.
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
            Loading laboratories...
          </span>
        </div>
      ) : (
        <div className="transition-all duration-150">
          {activeTab === "view" && (
            <ViewPartnerUI
              title="Registered Labs"
              countLabel="labs connected to your clinic"
              emptyText="No laboratories mapped yet. Switch to the 'Add' tab to connect diagnostic labs."
              clinicId={clinicId}
              data={viewItems}
              onToggleStatus={handleLabStatus}
              updatingId={updatingId}
            />
          )}

          {activeTab === "add" && (
            <AddPartnerUI
              data={labs.map((l) => ({
                id: l.lab_id,
                name: l.lab_name,
                logo: l.lab_logo,
                email: l.email,
                mobile: l.phone,
                address: l.address,
                city: l.city,
                state: l.state,
                alreadyMapped: mappedLabIds.has(l.lab_id),
                distance_km: l.distance_km,
              }))}
              icon={<ScienceIcon className="text-[var(--color-primary)]" />}
              placeholder="Search labs by name, city..."
              buttonText="Map Selected Labs"
              onSubmit={handleSubmitLabs}
              onSearchChange={handleSearchChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LabEmpanelment;
