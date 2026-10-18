import { useEffect, useState, useRef, useCallback } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import ScienceIcon from "@mui/icons-material/Science";
import { getSessionItem } from "../../context/sessions/userSession";

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
    try {
      setLoading(true);
      const res = await getMappedLabsListApi(clinicId, null);
      setMappedLabs(res.data);
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
      const result = await updateLabStatus({
        clinic_id: clinicId,
        lab_id: item.id,
        is_active: isActive ? false : true,
      });

      // if (result.success) {
      //   toast.success(isActive ? "Lab Deactivated" : "Lab Activated");
      // }
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
    <div className="w-full bg-[var(--color-surface-alt)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
      <div className="flex p-4 border-b border-b-[var(--color-primary)]">
        <div
          className="flex p-1 space-x-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
          style={{ background: "var(--color-primary)" }}
        >
          {[
            { key: "view", label: "View" },
            { key: "add", label: "Add" },
          ].map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key as "view" | "add")}
              className={`
          px-4 py-1.5 text-sm font-semibold cursor-pointer
          rounded-[var(--radius-md)]
          transition border-2
        `}
              style={{
                background:
                  activeTab === t.key
                    ? "var(--color-surface-alt)"
                    : "transparent",
                color:
                  activeTab === t.key
                    ? "var(--color-primary)"
                    : "var(--color-surface-alt)",
                borderColor:
                  activeTab === t.key ? "var(--color-primary)" : "transparent",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== t.key) {
                  e.currentTarget.style.borderColor =
                    "var(--color-surface-alt)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.key) {
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          className="p-3 text-[var(--color-info)]"
          style={{ fontSize: "var(--font-xs)" }}
        >
          Loading...
        </div>
      )}

      <div>
        {activeTab === "view" && (
          <ViewPartnerUI
            title="Registered Labs"
            countLabel="labs connected to your clinic"
            emptyText="No labs mapped yet."
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
            icon={<ScienceIcon className="text-[var(--color-info)]" />}
            placeholder="Search labs..."
            buttonText="Selected Labs"
            onSubmit={handleSubmitLabs}
            onSearchChange={handleSearchChange}
          />
        )}
      </div>
    </div>
  );
};

export default LabEmpanelment;
