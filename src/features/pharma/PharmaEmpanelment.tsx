import { useEffect, useState, useRef, useCallback } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import { getSessionItem } from "../../context/sessions/userSession";
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
    try {
      const res = await getMappedPharmaciesApi(clinicId, null);
      setMappedPharmas(res.data);
    } catch (error) {
      console.error(error);
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
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids: [],
        pharmacy_ids: ids,
      });
      await fetchPharmaByClinicId();
      setActiveTab("view");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Pharmacy already registered.");
      } else {
        toast.error("Failed to map pharmacy.");
      }

      console.error(err);
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
        : p
    )
  );

  try {
    const result = await updatePharmaStatus({
      clinic_id: clinicId,
      pharma_id: item.id,
      is_active: !isActive,
    });

    // if (result.success) {
    //   toast.success(
    //     isActive ? "Pharmacy Deactivated" : "Pharmacy Activated"
    //   );
    // }
  } catch (error: any) {
    setMappedPharmas((prev) =>
      prev.map((p) =>
        p.pharma_id === item.id
          ? { ...p, is_active: previousStatus }
          : p
      )
    );

    toast.error(
      error?.response?.data?.message ||
        "Failed to update pharmacy status"
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
              className="px-4 py-1.5 text-sm font-semibold cursor-pointer
                     rounded-[var(--radius-md)]
                     transition border-2"
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
            title="Registered Pharmacies"
            countLabel="pharmacies connected to your clinic"
            emptyText="No pharmacies mapped yet."
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
            icon={<LocalPharmacyIcon className="text-[var(--color-info)]" />}
            placeholder="Search pharmacy..."
            buttonText="Selected Pharmacy"
            onSubmit={handleSubmitPharma}
            onSearchChange={handleSearchChange}
          />
        )}
      </div>
    </div>
  );
};

export default PharmaEmpanelment;
