import React, { useEffect, useState } from "react";
import { getSessionItem } from "../../../context/sessions/userSession";
import { toast } from "react-toastify";
import {
  getDoctorReqListApi,
  getMappedDoctorApi,
  updateDoctorClinicMappingApi,
  type MappedDoctor,
} from "../../../api/clinic/ClinicEmpanelmentApis";
import MapDoctorToClinic from "./MapDoctorToClinic";
import DoctorViewUI from "../../component/DoctorViewUI";
import { useSocket } from "../../../context/SocketContext";

const DoctorEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "request">("view");
  const [docReqList, setDoctorReqList] = useState<MappedDoctor[]>([]);
  const [mappedDoctors, setMappedDoctor] = useState<MappedDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket } = useSocket();

  const user = getSessionItem("user", "user_id");
  const clinicId = getSessionItem("user", "clinic_id");

  const fetchRequestedDoctors = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await getDoctorReqListApi(clinicId);
      setDoctorReqList(res || []);
    } catch (err) {
      console.error("Doctor Request list error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMappedDoctorByClinicId = async () => {
    if (!clinicId) return;

    try {
      setLoading(true);

      const res = await getMappedDoctorApi(clinicId);

      if (Array.isArray(res)) {
        const normalized = res.map((d: any) => ({
          ...d,
          doctor_id: Number(d.doctor_id),
          consultation_fees: d.consultation_fees ? Number(d.consultation_fees) : 0,
          fees_duration: d.fees_duration ? Number(d.fees_duration) : 0,
          mapping_is_active:
            d.mapping_is_active === "1" ||
            d.mapping_is_active === true ||
            d.mapping_is_active === 1,
        }));

        setMappedDoctor(normalized);
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
    fetchRequestedDoctors();
  }, [clinicId]);

  useEffect(() => {
    fetchMappedDoctorByClinicId();
  }, [clinicId]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: any) => {
      if (activeTab !== "view") return;

      setMappedDoctor((prev) =>
        prev.map((d) =>
          d?.clinic_doctor_id == data.clinic_doctor_id
            ? {
                ...d,
                consultation_fees: Number(data.consultation_fees),
                fees_duration: Number(data.fees_duration),
                mapping_is_active:
                  data.is_active === "1" ||
                  data.is_active === true ||
                  data.is_active === 1,
              }
            : d,
        ),
      );
    };

    socket.on("doctorClinicMapping", handleUpdate);

    return () => {
      socket.off("doctorClinicMapping", handleUpdate);
    };
  }, [socket, activeTab]);

  const handleSubmitDoctors = async (
    doctorId: number,
    consultation_fees: number,
    fees_duration: number,
    clinicDoctorId?: number
  ) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    let targetClinicDocId = clinicDoctorId;
    if (!targetClinicDocId) {
      const match = docReqList.find(
        (d) => Number(d.doctor_id) === Number(doctorId)
      );
      if (match?.clinic_doctor_id) {
        targetClinicDocId = Number(match.clinic_doctor_id);
      }
    }

    if (!targetClinicDocId) {
      toast.error("Clinic Doctor ID not found for this request.");
      return;
    }

    try {
      await updateDoctorClinicMappingApi({
        clinic_doctor_id: targetClinicDocId,
        is_active: "1",
        consultation_fees,
        fees_duration,
        is_approved: true,
        approved_by: String(user ?? ""),
      });

      toast.success("Doctor Request Accepted Successfully.");

      await fetchMappedDoctorByClinicId();
      await fetchRequestedDoctors();

      setActiveTab("view");
    } catch (err: any) {
      console.error("Failed to accept doctor request", err);
      toast.error(
        err?.response?.data?.message || "Failed to accept doctor request."
      );
    }
  };

  const mappedDoctorIds = new Set(
    mappedDoctors.map((d) => Number(d.doctor_id))
  );

  const viewItems = mappedDoctors.map((d) => ({
    id: Number(d.doctor_id),
    name: d.doctor_name || d.name || "",
    logo: d.profile_pic || undefined,
    phone: d.phone || "",
    email: d.email || "",
    address: d.address || "",
    city: d.city || "",
    state: d.state || "",
    consultation_fees:
      d.consultation_fees !== undefined ? Number(d.consultation_fees) : undefined,
    fees_duration:
      d.fees_duration !== undefined ? Number(d.fees_duration) : undefined,
    qualification: d.qualification || "",
    specialization:
      d.specialized_in ||
      (Array.isArray(d.specialization)
        ? d.specialization.join(", ")
        : d.specialization) ||
      "",
    experience: d.experience ? Number(d.experience) : undefined,
    is_active: Boolean(d.mapping_is_active),
    clinic_doctor_id: d.clinic_doctor_id ? Number(d.clinic_doctor_id) : undefined,
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
            { key: "request", label: "Request" },
          ].map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key as "view" | "request")}
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
          <DoctorViewUI
            title="Registered Doctors"
            countLabel="doctor connected to your clinic"
            emptyText="No doctor mapped yet."
            clinicId={clinicId}
            data={viewItems}
          />
        )}

        {activeTab === "request" && (
          <MapDoctorToClinic
            placeholder="Search doctor..."
            data={(docReqList ?? []).map((d: any) => {
              const docId = Number(d.doctor_id);
              const clinicDocId = d.clinic_doctor_id
                ? Number(d.clinic_doctor_id)
                : undefined;

              // Doctor is already added if marked as approved or already present in mappedDoctors
              const isAlreadyAdded =
                d.is_approved === true ||
                d.is_approved === "1" ||
                d.is_approved === 1 ||
                mappedDoctorIds.has(docId);

              const spec =
                d.specialized_in ||
                (Array.isArray(d.specialization)
                  ? d.specialization.join(", ")
                  : d.specialization) ||
                "";

              return {
                id: docId,
                clinic_doctor_id: clinicDocId,
                name: d.doctor_name || d.name || "",
                logo: d.profile_pic || undefined,
                phone: d.phone || "",
                email: d.email || "",
                address: d.address || "",
                city: d.city || "",
                state: d.state || "",
                pincode: d.pincode || "",
                experience: d.experience ? Number(d.experience) : undefined,
                specialization: spec,
                qualification: d.qualification || "",
                doctor_code: d.doctor_code || "",
                consultation_fees: d.consultation_fees
                  ? Number(d.consultation_fees)
                  : undefined,
                fees_duration: d.fees_duration
                  ? Number(d.fees_duration)
                  : undefined,
                alreadyMapped: Boolean(isAlreadyAdded),
              };
            })}
            onSubmit={handleSubmitDoctors}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorEmpanelment;
