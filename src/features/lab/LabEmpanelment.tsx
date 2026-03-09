import { useEffect, useState } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import ScienceIcon from "@mui/icons-material/Science";
import { getSession } from "../../context/sessions/userSession";
import {
  getActiveLabListApi,
  getMappedLabsApi,
} from "../../api/labApis/LabApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";
import type { LabApiItem } from "../../types/labType/LabTestInterfaces";
import { toast } from "react-toastify";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

const LabEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  const [labs, setLabs] = useState<LabApiItem[]>([]);
  const [mappedLabs, setMappedLabs] = useState<LabApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await getActiveLabListApi();
      setLabs(res.data);
    } catch (err) {
      console.error("Lab list error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMappedLabByClinicId = async () => {
    try {
      setLoading(true);
      const res = await getMappedLabsApi(clinicId);
      setMappedLabs(res.data);
    } catch (err) {
      console.error("Lab list error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
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
    id: l.lab_id,
    name: l.lab_name,
    logo: l.lab_logo,
    phone: l.phone,
    email: l.email,
    address: l.address,
    city:l.city,
    state:l.state,
    status: l.status,
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
              className={`
          px-4 py-1.5 text-sm font-semibold cursor-pointer
          rounded-[var(--radius-md)]
          transition border-2
        `}
              style={{
                background:activeTab === t.key ? "var(--color-surface-alt)" : "transparent",
                color:activeTab === t.key
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

      {loading && <div className="p-3 text-[var(--color-info)]" style={{fontSize:"var(--font-xs)"}}>Loading...</div>}

      <div>
        {activeTab === "view" && (
          <ViewPartnerUI
            title="Registered Labs"
            countLabel="labs connected to your clinic"
            emptyText="No labs mapped yet."
            clinicId={clinicId}
            data={viewItems}
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
              city:l.city,
              state:l.state,
              alreadyMapped: mappedLabIds.has(l.lab_id),
            }))}
            icon={<ScienceIcon className="text-[var(--color-info)]" />}
            placeholder="Search labs..."
            buttonText="Add Selected Labs"
            onSubmit={handleSubmitLabs}
          />
        )}
      </div>
    </div>
  );
};

export default LabEmpanelment;
