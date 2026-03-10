import { useEffect, useState } from "react";
import ViewPartnerUI from "../../component/ViewPartnerUI";
import {
  getSession,
  getSessionItem,
} from "../../../context/sessions/userSession";
import { toast } from "react-toastify";
import { getDoctorListApi, type DoctorList } from "../../../api";
import {
  getMappedDoctorApi,
  mapDoctorClinicApi,
} from "../../../api/clinic/ClinicDoctorApi";
import MapDoctorToClinic from "./MapDoctorToClinic";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

const DoctorEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [doctor, setDoctor] = useState<DoctorList[]>([]);
  const [mappedDoctors, setMappedDoctor] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const user = getSessionItem("user", "user_id");

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await getDoctorListApi();
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
      if (Array.isArray(res)) {
        setMappedDoctor(res);
      } else {
        setMappedDoctor([]);
      }
    } catch (err) {
      console.error("Mapped doctor list error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappedDoctorByClinicId();
  }, [clinicId]);

  const handleSubmitDoctors = async (
    doctorId: number,
    consultation_fees: number,
    fees_duration: number,
  ) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    const existingIds = mappedDoctors.map((d) => Number(d.doctor_id));

    if (existingIds.includes(doctorId)) {
      toast.warning("Doctor already registered.");
      return;
    }

    try {
      await mapDoctorClinicApi({
        clinic_id: clinicId,
        doctor_id: doctorId,
        consultation_fees,
        fees_duration,
        is_active: "1",
        created_by: user,
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
    }
  };

  // const mappedDoctorIds = new Set(mappedDoctors.map((d) => d.doctor_id));
  const mappedDoctorIds = new Set(
    mappedDoctors.map((d) => Number(d.doctor_id)),
  );
  const viewItems = mappedDoctors?.map((d) => ({
    id: d.doctor_id,
    name: d.doctor_name,
    logo: d.profile_pic,
    phone: d.phone,
    email: d.email,
    address: d.address,
    city: d.city,
    state: d.state,
    consultation_fees: d.consultation_fees,
    fees_duration: d.fees_duration,
    qualification: d.qualification
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
              className="px-4 py-1.5 text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition border-2"
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
          <MapDoctorToClinic
            placeholder="Search doctor..."
            data={(doctor ?? []).map((d) => ({
              id: d.doctor_id,
              name: d.name,
              logo: d.profile_pic,
              phone: d.phone,
              email: d.email,
              address: d.address,
              city: d.city,
              state: d.state,
              pincode: d.pincode,
              experience:d.experience,
              specialization:d.specialization,
              qualification:d.qualification,
              alreadyMapped: mappedDoctorIds.has(Number(d.doctor_id)),
            }))}
            onSubmit={handleSubmitDoctors}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorEmpanelment;
