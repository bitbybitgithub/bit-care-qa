import { useEffect, useState } from "react";
import AddPartnerUI from "../../component/AddPartnerUI";
import ViewPartnerUI from "../../component/ViewPartnerUI";
import ScienceIcon from "@mui/icons-material/Science";
import { getSession } from "../../../context/sessions/userSession";
import { toast } from "react-toastify";
import { getDoctorListApi, getMappedDoctorApi, type DoctorList } from "../../../api";
import { mapClinicPartnersApi } from "../../../api/CommonApi/SaveLabAndPharmaApi";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

console.log("clinic ID",clinicId)

const DoctorEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  const [doctor, setDoctor] = useState<DoctorList[]>([]);
  const [mappedDoctors, setMappedDoctor] = useState<DoctorList[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await getDoctorListApi();
      console.log("get all doctor list",res)
      setDoctor(res);
    } catch (err) {
      console.error("Doctor list error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchMappedDoctorByClinicId = async () => {
    try {
      setLoading(true);
      const res = await getMappedDoctorApi(clinicId);
      console.log("res",res)
      setMappedDoctor(res);
    } catch (err) {
      console.error("Doctor list error", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMappedDoctorByClinicId();
  }, [clinicId]);

  const handleSubmitDoctors = async (ids: number[]) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    const existingIds = mappedDoctors.map((l) => l.doctor_id);
    const duplicates = ids.filter((id) => existingIds.includes(id));

    if (duplicates.length) {
      toast.warning("Some selected doctor are already registered.");
      return;
    }
    try {
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids:[],
        pharmacy_ids: [],
        doctor_ids: ids,
      });
      toast.success("Doctor Added Successfully.");
      await fetchMappedDoctorByClinicId();
      setActiveTab("view");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("Doctor already registered.");
      } else {
        toast.error("Failed to map doctor.");
      }

      console.error(err);
    }
  };

  const mappedDoctorIds = new Set(mappedDoctors.map((d) => d.doctor_id));

  const viewItems = mappedDoctors?.map((d) => ({
    id: d.doctor_id,
    name: d.name,
    logo: d.profile_pic,
    phone: d.phone,
    email: d.email,
    address: d.address,
  }));
console.log("view items",viewItems)
console.log("mappedDoctorss",mappedDoctors)
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
            title="Registered Doctors"
            countLabel="doctor connected to your clinic"
            emptyText="No doctor mapped yet."
            clinicId={clinicId}
            data={viewItems}
          />
        )}

        {activeTab === "add" && (
          <AddPartnerUI
            data={(doctor ?? []).map((d) => ({
              id: d.doctor_id,
              name: d.name,
              logo: d.profile_pic,
              phone: d.phone,
              email: d.email,
              address: d.address,
              alreadyMapped: mappedDoctorIds.has(d.doctor_id),
            }))}
            icon={<ScienceIcon className="text-[var(--color-info)]" />}
            placeholder="Search doctor..."
            buttonText="Add Selected Doctors"
            onSubmit={handleSubmitDoctors}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorEmpanelment;
