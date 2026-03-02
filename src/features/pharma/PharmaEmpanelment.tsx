import { useEffect, useState } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import { getSession } from "../../context/sessions/userSession";
import {
  getActivePharmaListApi,
  getMappedPharmaciesApi,
} from "../../api/pharmacyApi/PharmacyApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";
import type { PharmaApiItem } from "../../types/pharmacyType/pharmacyInterfaceType";
import { toast } from "react-toastify";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

const PharmaEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [pharmas, setPharmas] = useState<PharmaApiItem[]>([]);
  const [mappedPharmas, setMappedPharmas] = useState<PharmaApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPharmas = async () => {
    try {
      setLoading(true);
      const res = await getActivePharmaListApi();
      setPharmas(res.data);
    } catch (err) {
      console.error("Pharma list error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmaByClinicId = async () => {
    try {
      const res = await getMappedPharmaciesApi(clinicId);
      setMappedPharmas(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const mappedIds = new Set(mappedPharmas.map((p) => p.pharma_id));

  useEffect(() => {
    fetchPharmaByClinicId();
  }, [clinicId]);

  useEffect(() => {
    fetchPharmas();
  }, []);

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
    }
  };

  const viewItems = mappedPharmas?.map((p) => ({
    id: p.pharma_id,
    name: p.pharma_name,
    logo: p.pharma_logo,
    phone: p.mobile,
    email: p.email,
    address: p.address,
  }));
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
                  activeTab === t.key ? "var(--color-surface-alt)" : "transparent",
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
                  e.currentTarget.style.borderColor = "var(--color-surface-alt)";
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
          />
        )}

        {activeTab === "add" && (
          <AddPartnerUI
            data={pharmas.map((p) => ({
              id: p.pharma_id,
              name: p.pharma_name,
              logo: p.pharma_logo,
              email: p.email,
              mobile: p.mobile,
              address: p.address,
              alreadyMapped: mappedIds.has(p.pharma_id),
            }))}
            icon={<LocalPharmacyIcon className="text-[var(--color-info)]" />}
            placeholder="Search pharmacy..."
            buttonText="Add Selected Pharmacy"
            onSubmit={handleSubmitPharma}
          />
        )}
      </div>
    </div>
  );
};

export default PharmaEmpanelment;
