import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  FaTimes,
  FaSearch,
  FaFlask,
  FaPlusCircle,
  FaClinicMedical,
  FaUser,
  FaPhoneAlt,
  FaBoxes,
  FaFilePrescription,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getLabTestListApi } from "../../../api/labApis/LabApi";
import {
  updatePatientTestsApi,
  type UpdatePatientTestsRequest,
} from "../../../api/labApis/labQueuesApi";
import { getSessionItem } from "../../../context/sessions/userSession";
import PdfViewerDialog from "../../../components/common/PdfViewerDialog";
import type { AvailablePatientTest, LabQueueRow } from "./LabQueueTypes";

interface LabAddTestDialogProps {
  row: LabQueueRow | null;
  pdfUrl: string | null;
  pdfLoading: boolean;
  viewOnly?: boolean;
  onClose: () => void;
  onTestsAdded: (row: LabQueueRow, tests: AvailablePatientTest[]) => void;
}

export default function LabAddTestDialog({
  row,
  pdfUrl,
  pdfLoading,
  viewOnly = false,
  onClose,
  onTestsAdded,
}: LabAddTestDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileTab, setMobileTab] = useState<"prescription" | "tests">("tests");

  const [availableTests, setAvailableTests] = useState<AvailablePatientTest[]>(
    [],
  );
  const [selectedTests, setSelectedTests] = useState<AvailablePatientTest[]>(
    [],
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    if (viewOnly) {
      setAvailableTests([]);
      setSelectedTests([]);
      setSearch("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    const loadTests = async () => {
      setLoading(true);
      setAvailableTests([]);
      setSelectedTests([]);
      setSearch("");
      try {
        const response = await getLabTestListApi(Number(row.lab_id));
        const responseData = (response as { data?: unknown })?.data;
        const tests = Array.isArray(responseData) ? responseData : [];
        const currentTestIds = new Set(
          [
            ...(Array.isArray(row.test_details) ? row.test_details : []),
            ...(Array.isArray(row.package_tests) ? row.package_tests : []),
          ]
            .map((test) => Number(test.test_id))
            .filter((testId) => Number.isFinite(testId)),
        );
        const parsedTests = tests.map((item) => {
          const test = item as Record<string, unknown>;

          const price = Number(test.price ?? test.test_price ?? 0);
          const discountPrice = Number(test.discount_price ?? 0);
          return {
            test_id: Number(test.test_id),
            category_id: Number(test.category_id),
            test_name: String(test.test_name || ""),
            test_code:
              typeof test.test_code === "string" ? test.test_code : undefined,
            category_name:
              typeof test.category_name === "string"
                ? test.category_name
                : undefined,
            price,
            discount_price: discountPrice,
            payable_amount:
              test.payable_amount != null
                ? Number(test.payable_amount)
                : Math.max(0, price - discountPrice),
          };
        });

        if (!cancelled) {
          setAvailableTests(
            parsedTests.filter((test) => !currentTestIds.has(test.test_id)),
          );
        }
      } catch (error) {
        console.error("Failed to load available lab tests:", error);
        toast.error("Failed to load available tests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadTests();
    return () => {
      cancelled = true;
    };
  }, [row, viewOnly]);

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableTests;
    return availableTests.filter(
      (test) =>
        test.test_name.toLowerCase().includes(query) ||
        test.test_code?.toLowerCase().includes(query),
    );
  }, [availableTests, search]);

  const assignedTests = row?.test_details?.length
    ? row.test_details
    : row?.package_tests || [];

  const hasPackage = Boolean(
    row?.is_package === "1" ||
      row?.is_package === 1 ||
      row?.package_id ||
      row?.package_name ||
      row?.package_code,
  );

  const bookingSource = (row?.booking_source || "").toUpperCase();
  const isClinic = bookingSource === "CLINIC";
  const isSelf = bookingSource === "LAB";
  const showPrescription = isClinic && Boolean(row?.prescription_url);
  const showTests = !viewOnly || assignedTests.length > 0 || hasPackage;

  const toggleTest = (test: AvailablePatientTest) => {
    setSelectedTests((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

  const totalAdditionalPayable = useMemo(() => {
    return selectedTests.reduce(
      (acc, t) => acc + (t.payable_amount ?? Math.max(0, t.price - t.discount_price)),
      0,
    );
  }, [selectedTests]);

  const saveTests = async () => {
    if (!row || !selectedTests.length) {
      toast.error("Select at least one test");
      return;
    }
    if (
      !row.lab_id ||
      !row.patient_id ||
      !row.lab_record_id ||
      !row.lab_appointment_id
    ) {
      toast.error("Patient appointment details are missing");
      return;
    }
    try {
      setSaving(true);
      const payload: UpdatePatientTestsRequest = {
        lab_id: Number(row.lab_id),
        patient_id: Number(row.patient_id),
        lab_record_id: Number(row.lab_record_id),
        lab_appointment_id: Number(row.lab_appointment_id),
        tests: selectedTests.map((test) => ({
          test_id: test.test_id,
          category_id: test.category_id,
          test_price: test.price,
        })),
        modified_by: Number(getSessionItem("user", "user_id")),
      };
      const response = await updatePatientTestsApi(payload);
      if (
        !response?.success ||
        response.success === "false" ||
        response.success === "0"
      ) {
        throw new Error(response?.message || "Failed to update patient tests");
      }
      onTestsAdded(row, selectedTests);
      toast.success("Tests added successfully");
      onClose();
    } catch (error) {
      console.error("Update patient tests failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save tests for this patient",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!row) return null;

  const testContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Current Assigned Tests */}
      {assignedTests.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]/40">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <FaFlask className="text-[var(--color-primary)] text-sm" />
                Current Tests
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Tests already assigned to this patient
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              {assignedTests.length} {assignedTests.length === 1 ? "Test" : "Tests"}
            </span>
          </div>

          <div className="space-y-2">
            {assignedTests.map((test, index) => {
              const actualPrice = Number(test.test_price ?? test.price ?? 0);
              const discountPrice = Number(test.discount_price ?? 0);
              const payablePrice =
                test.payable_amount != null
                  ? Number(test.payable_amount)
                  : Math.max(0, actualPrice - discountPrice);

              return (
                <div
                  key={`current-${test.test_id ?? test.test_name ?? test.name}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)] transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base text-[var(--color-text)]">
                        {test.test_name || test.name || "Lab test"}
                      </h4>
                      {(test.test_code || test.category_name) && (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          {test.test_code ? `Code: ${test.test_code}` : ""}
                          {test.test_code && test.category_name ? " • " : ""}
                          {test.category_name ? test.category_name : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/30 text-right">
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Actual Price: <span className="font-medium text-[var(--color-text)]">₹{actualPrice.toFixed(2)}</span>
                      </span>
                      {discountPrice > 0 && (
                        <span className="text-xs text-[var(--color-success)] font-medium">
                          Discount: -₹{discountPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-[var(--color-primary)] sm:mt-1">
                      Payable Price: ₹{payablePrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Notice (if applicable) */}
      {hasPackage && (
        <div className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              <FaBoxes /> Package Assigned
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white">
              {row.package_name || row.package_code || "Package"}
            </span>
          </div>
          {row.package_description && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {row.package_description}
            </p>
          )}
        </div>
      )}

      {/* Search Input for Available Tests */}
      {!viewOnly && (
        <div className="pt-2">
          <div className="relative w-full">
            <FaSearch className="absolute left-3.5 top-3 text-[var(--color-primary)] text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests by name or test code..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-text-secondary)]/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-xs cursor-pointer"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Additional Tests Section */}
      {!viewOnly && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]/40">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)] flex items-center gap-2">
                <FaPlusCircle className="text-[var(--color-primary)] text-sm" />
                Add Additional Tests
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Select tests from catalog to add to this patient
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              {filteredTests.length} Available
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CircularProgress size={28} sx={{ color: "var(--color-primary)" }} />
              <p className="text-xs text-[var(--color-text-secondary)]">Loading available tests...</p>
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredTests.map((test) => {
                const isChecked = selectedTests.some(
                  (item) => item.test_id === test.test_id,
                );
                const actual = Number(test.price ?? 0);
                const discount = Number(test.discount_price ?? 0);
                const payable = test.payable_amount != null
                  ? Number(test.payable_amount)
                  : Math.max(0, actual - discount);

                return (
                  <div
                    key={`available-${test.test_id}`}
                    onClick={() => toggleTest(test)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[var(--radius-lg)] border transition-all cursor-pointer ${
                      isChecked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[var(--shadow-sm)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)]/60 hover:shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleTest(test)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{
                          p: 0.5,
                          color: "var(--color-border)",
                          "&.Mui-checked": {
                            color: "var(--color-primary)",
                          },
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[var(--color-text)]">
                          {test.test_name}
                        </h4>
                        {(test.test_code || test.category_name) && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            {test.test_code ? `Code: ${test.test_code}` : ""}
                            {test.test_code && test.category_name ? " • " : ""}
                            {test.category_name ? test.category_name : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/30 text-right pl-7 sm:pl-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Actual Price: <span className="font-medium text-[var(--color-text)]">₹{actual.toFixed(2)}</span>
                        </span>
                        {discount > 0 && (
                          <span className="text-xs text-[var(--color-success)] font-medium">
                            Discount: -₹{discount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[var(--color-primary)] sm:mt-0.5">
                        Payable Price: ₹{payable.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {search ? `No tests matching "${search}"` : "No additional tests available"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Tests Summary Box */}
      {!viewOnly && selectedTests.length > 0 && (
        <div className="p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <span>Additional Tests Selected:</span>
            <span className="font-bold text-[var(--color-text)]">
              {selectedTests.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedTests.map((t) => (
              <span
                key={`badge-${t.test_id}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text)]"
              >
                {t.test_name}
                <button
                  type="button"
                  onClick={() => toggleTest(t)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-error)] ml-0.5 cursor-pointer"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)]/50 pt-2 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[var(--color-text)]">
              Total Additional Payable:
            </span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-primary)]">
              ₹{totalAdditionalPayable.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      maxWidth={showPrescription ? "xl" : "md"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-bg)",
          overflow: "hidden",
          width: showPrescription
            ? { xs: "96vw", sm: "92vw", md: "90vw", lg: "86vw" }
            : { xs: "96vw", sm: "88vw", md: "680px", lg: "740px" },
          maxHeight: "92vh",
          height: showPrescription ? { xs: "92vh", md: "86vh" } : "auto",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
        },
      }}
    >
      {/* Header Bar matching Screen 3 */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <div className="min-w-0 pr-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
              {viewOnly ? "Patient Test Details" : "Add Tests for Patient"}
            </h2>
            {isClinic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                <FaClinicMedical className="text-[11px]" /> Clinic Referral
              </span>
            )}
            {isSelf && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FaUser className="text-[11px]" /> Self Booking
              </span>
            )}
            {!isClinic && !isSelf && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                <FaUser className="text-[11px]" /> Patient Direct
              </span>
            )}
          </div>

          {/* Patient Meta line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-primary)] text-sm">
              {row.patient_name}
              {row.gender && ` (${row.gender.toUpperCase().charAt(0)})`}
            </span>
            {row.contact_no && (
              <span className="flex items-center gap-1">
                <FaPhoneAlt className="text-[10px] opacity-70" />
                {row.contact_no}
              </span>
            )}
            {isClinic && (row.clinic_name || row.doctor_name) && (
              <span className="flex items-center gap-1 font-medium text-[var(--color-text)]">
                <FaClinicMedical className="text-[10px] text-[var(--color-primary)]" />
                {row.clinic_name || "Clinic"}
                {row.doctor_name ? ` (Dr. ${row.doctor_name})` : ""}
              </span>
            )}
          </div>
        </div>

        <IconButton
          aria-label="Close dialog"
          onClick={onClose}
          size="small"
          sx={{
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-surface)",
            "&:hover": {
              backgroundColor: "var(--color-surface-alt)",
              color: "var(--color-primary)",
            },
          }}
        >
          <FaTimes />
        </IconButton>
      </div>

      {/* Main Content Area */}
      <DialogContent
        dividers
        sx={{
          p: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          backgroundColor: "var(--color-bg)",
        }}
      >
        {showPrescription && showTests ? (
          <>
            {/* Mobile Tab Control for Clinic Split View */}
            {isMobile && (
              <div className="flex p-1 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileTab("prescription")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-md)] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileTab === "prescription"
                      ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  <FaFilePrescription /> Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("tests")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-[var(--radius-md)] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    mobileTab === "tests"
                      ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                  }`}
                >
                  <FaFlask /> Tests
                </button>
              </div>
            )}

            {/* Desktop 2-column or Mobile Active Tab View */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Column: Prescription Viewer */}
              {(!isMobile || mobileTab === "prescription") && (
                <div className="w-full md:w-[56%] h-full min-h-0 border-r-0 md:border-r border-[var(--color-border)] flex flex-col bg-[var(--color-surface)]">
                  {pdfLoading ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
                      <CircularProgress
                        size={36}
                        sx={{ color: "var(--color-primary)" }}
                      />
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        Loading prescription document...
                      </p>
                    </div>
                  ) : pdfUrl ? (
                    <PdfViewerDialog
                      open={true}
                      pdfUrl={pdfUrl}
                      loading={false}
                      onClose={onClose}
                      embedded
                      title="Patient Prescription"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-2">
                      <FaFilePrescription className="text-3xl text-[var(--color-text-secondary)] opacity-40 mb-1" />
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        No Prescription Document Available
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Tests */}
              {(!isMobile || mobileTab === "tests") && (
                <div className="w-full md:w-[44%] h-full min-h-0 flex flex-col bg-[var(--color-bg)]">
                  {testContent}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Single Column Layout (Screen 1 & Screen 3) */
          <div className="max-h-[72vh] overflow-y-auto">
            {testContent}
          </div>
        )}
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.5,
          borderTop: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface-alt)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: "var(--radius-lg)",
            px: 3,
            py: 0.8,
            textTransform: "none",
            fontWeight: 600,
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
            "&:hover": {
              borderColor: "var(--color-primary)",
              backgroundColor: "var(--color-surface)",
            },
          }}
        >
          {viewOnly ? "Close" : "Cancel"}
        </Button>

        {!viewOnly && (
          <Button
            variant="contained"
            disabled={!selectedTests.length || saving || loading}
            onClick={saveTests}
            sx={{
              borderRadius: "var(--radius-lg)",
              px: 3.5,
              py: 0.8,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "var(--color-primary-dark)",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
                color: "#ffffff",
                backgroundColor: "var(--color-primary)",
              },
            }}
          >
            {saving ? "Saving..." : `Save ${selectedTests.length} Test(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
