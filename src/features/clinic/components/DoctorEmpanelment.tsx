import React, { useEffect, useState } from "react";
import { getSessionItem } from "../../../context/sessions/userSession";
import { toast } from "react-toastify";
import { UserCheck, Sparkles, Layers, UserPlus } from "lucide-react";
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="w-full min-h-[calc(100vh-80px)]  space-y-3">
      {/* =====================================================
          HEADER & TAB CONTROLS (RESPONSIVE - OFFERS TABS STYLE)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Branding & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Doctor Empanelment
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  Medical Staff
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                Manage affiliated doctors, consultation fees, and doctor empanelment requests.
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
              aria-selected={activeTab === "request"}
              onClick={() => setActiveTab("request")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "request"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Request</span>
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
            Loading doctors...
          </span>
        </div>
      ) : (
        <div className="transition-all duration-150">
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
      )}
    </div>
  );
};

export default DoctorEmpanelment;
