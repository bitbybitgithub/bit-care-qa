import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
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
  variant?: "clinic" | "patient";
  onClose: () => void;
  onTestsAdded: (row: LabQueueRow, tests: AvailablePatientTest[]) => void;
}

type AssignedTest = {
  test_id?: number | string;
  test_name?: string;
  name?: string;
  test_code?: string;
  category_name?: string;
  test_price?: number | string | null;
  price?: number | string | null;
  discount_price?: number | string | null;
  payable_amount?: number | string | null;
};

const CARD_RADIUS = "rounded-[10px]";

export default function LabAddTestDialog({
  row,
  pdfUrl,
  pdfLoading,
  viewOnly = false,
  variant,
  onClose,
  onTestsAdded,
}: LabAddTestDialogProps) {
  // matches Tailwind's `md` breakpoint (768px)
  const isMobile = useMediaQuery("(max-width: 767px)");
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
    setMobileTab("tests");
  }, [row?.lab_record_id]);

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

  const assignedTests = (row?.test_details?.length
    ? row.test_details
    : row?.package_tests || []) as unknown as AssignedTest[];

  const hasPackage = Boolean(
    row?.is_package === "1" ||
    row?.is_package === 1 ||
    row?.package_id ||
    row?.package_name ||
    row?.package_code,
  );

  const bookingSource = (row?.booking_source || "").toUpperCase();
  const isSelf = bookingSource === "LAB";
  const isClinicVariant =
    variant === "clinic" ||
    (variant == null &&
      (bookingSource === "CLINIC" ||
        Boolean(row?.prescription_url || row?.clinic_id || row?.clinic_name)));

  const showPrescription = Boolean(isClinicVariant && row?.prescription_url);
  const showTests = !viewOnly || assignedTests.length > 0 || hasPackage;
  const bothPanels = showPrescription && showTests;
  const prescriptionOnly = showPrescription && !showTests;

  const toggleTest = (test: AvailablePatientTest) => {
    setSelectedTests((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

  const totalAdditionalPayable = useMemo(() => {
    return selectedTests.reduce(
      (acc, t) =>
        acc + (t.payable_amount ?? Math.max(0, t.price - t.discount_price)),
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

  /* ---------------- TESTS PANEL CONTENT ---------------- */
  const testContent = (
    <div className="space-y-4 p-4 sm:p-5">
      {/* Current assigned tests */}
      {assignedTests.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/40 pb-1.5">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)] sm:text-base">
                <FaFlask className="text-sm text-[var(--color-primary)]" />
                Current Tests
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Tests already assigned to this patient
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              {assignedTests.length}{" "}
              {assignedTests.length === 1 ? "Test" : "Tests"}
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
                  className={`flex flex-col justify-between gap-2.5 ${CARD_RADIUS} border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 shadow-[var(--shadow-xs)] transition-all hover:border-[var(--color-primary)] sm:flex-row sm:items-center`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="break-words text-sm font-semibold text-[var(--color-text)] sm:text-base">
                        {test.test_name || test.name || "Lab test"}
                      </h4>
                      {(test.test_code || test.category_name) && (
                        <p className="mt-0.5 break-words text-xs text-[var(--color-text-secondary)]">
                          {test.test_code ? `Code: ${test.test_code}` : ""}
                          {test.test_code && test.category_name ? " • " : ""}
                          {test.category_name ? test.category_name : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)]/30 pt-2 text-right sm:flex-col sm:items-end sm:justify-center sm:whitespace-nowrap sm:border-t-0 sm:pt-0">
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        Actual Price:{" "}
                        <span className="font-medium text-[var(--color-text)]">
                          ₹{actualPrice.toFixed(2)}
                        </span>
                      </span>
                      {discountPrice > 0 && (
                        <span className="text-xs font-medium text-[var(--color-success)]">
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

      {/* Package notice */}
      {hasPackage && (
        <div
          className={`${CARD_RADIUS} border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-xs)]`}
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              <FaBoxes /> Package Assigned
            </span>
            <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
              {row.package_name || row.package_code || "Package"}
              {row.package_price != null &&
                ` — ₹${Number(row.package_price).toFixed(2)}`}
            </span>
          </div>
          {row.package_description && (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {row.package_description}
            </p>
          )}
        </div>
      )}

      {/* Empty state for view-only */}
      {viewOnly && !assignedTests.length && !hasPackage && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          No tests are assigned to this patient.
        </p>
      )}

      {/* Search */}
      {!viewOnly && (
        <div className="sticky top-0 z-10 -mx-4 bg-[var(--color-bg)] px-4 py-2 sm:-mx-5 sm:px-5">
          <div className="relative w-full">
            <FaSearch className="pointer-events-none absolute left-3.5 top-3 text-sm text-[var(--color-primary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests by name or test code..."
              className={`w-full ${CARD_RADIUS} border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-8 text-xs text-[var(--color-text)] transition-all placeholder:text-[var(--color-text-secondary)]/60 focus:border-[var(--color-primary)] focus:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 sm:text-sm`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 cursor-pointer text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Additional tests */}
      {!viewOnly && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/40 pb-1.5">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text)] sm:text-base">
                <FaPlusCircle className="text-sm text-[var(--color-primary)]" />
                Add Additional Tests
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Select tests from catalog to add to this patient
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--color-primary)]">
              {filteredTests.length} Available
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <CircularProgress
                size={28}
                sx={{ color: "var(--color-primary)" }}
              />
              <p className="text-xs text-[var(--color-text-secondary)]">
                Loading available tests...
              </p>
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="space-y-2">
              {filteredTests.map((test) => {
                const isChecked = selectedTests.some(
                  (item) => item.test_id === test.test_id,
                );
                const actual = Number(test.price ?? 0);
                const discount = Number(test.discount_price ?? 0);
                const payable =
                  test.payable_amount != null
                    ? Number(test.payable_amount)
                    : Math.max(0, actual - discount);

                return (
                  <div
                    key={`available-${test.test_id}`}
                    onClick={() => toggleTest(test)}
                    className={`flex cursor-pointer flex-col justify-between gap-2.5 ${CARD_RADIUS} border p-3 transition-all sm:flex-row sm:items-center ${
                      isChecked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[var(--shadow-sm)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)]/60 hover:shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleTest(test)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        sx={{
                          p: 0.5,
                          flexShrink: 0,
                          color: "var(--color-border)",
                          "&.Mui-checked": {
                            color: "var(--color-primary)",
                          },
                        }}
                      />
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-semibold text-[var(--color-text)]">
                          {test.test_name}
                        </h4>
                        {(test.test_code || test.category_name) && (
                          <p className="mt-0.5 break-words text-xs text-[var(--color-text-secondary)]">
                            {test.test_code ? `Code: ${test.test_code}` : ""}
                            {test.test_code && test.category_name ? " • " : ""}
                            {test.category_name ? test.category_name : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border)]/30 pl-7 pt-2 text-right sm:flex-col sm:items-end sm:justify-center sm:whitespace-nowrap sm:border-t-0 sm:pl-0 sm:pt-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Actual Price:{" "}
                          <span className="font-medium text-[var(--color-text)]">
                            ₹{actual.toFixed(2)}
                          </span>
                        </span>
                        {discount > 0 && (
                          <span className="text-xs font-medium text-[var(--color-success)]">
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
            <div
              className={`${CARD_RADIUS} border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-6 text-center`}
            >
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {search
                  ? `No tests matching "${search}"`
                  : "No additional tests available"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected summary */}
      {!viewOnly && selectedTests.length > 0 && (
        <div
          className={`space-y-2 ${CARD_RADIUS} border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-xs)]`}
        >
          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] sm:text-sm">
            <span>Additional Tests Selected:</span>
            <span className="font-bold text-[var(--color-text)]">
              {selectedTests.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedTests.map((t) => (
              <span
                key={`badge-${t.test_id}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]"
              >
                <span className="truncate">{t.test_name}</span>
                <button
                  type="button"
                  onClick={() => toggleTest(t)}
                  aria-label={`Remove ${t.test_name}`}
                  className="ml-0.5 shrink-0 cursor-pointer text-[var(--color-text-secondary)] hover:text-[var(--color-error)]"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)]/50 pt-2">
            <span className="text-xs font-bold text-[var(--color-text)] sm:text-sm">
              Total Additional Payable:
            </span>
            <span className="text-sm font-bold text-[var(--color-primary)] sm:text-base">
              ₹{totalAdditionalPayable.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------------- PRESCRIPTION PANEL ---------------- */
  const prescriptionPanel = pdfLoading ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <CircularProgress size={36} sx={{ color: "var(--color-primary)" }} />
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
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <FaFilePrescription className="mb-1 text-3xl text-[var(--color-text-secondary)] opacity-40" />
      <p className="text-sm font-semibold text-[var(--color-text)]">
        Unable to load the prescription.
      </p>
    </div>
  );

  const tabClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-1.5 ${CARD_RADIUS} py-2 text-xs font-semibold transition-all ${
      active
        ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
    }`;

  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      aria-labelledby="lab-add-test-title"
      PaperProps={{
        sx: {
          backgroundColor: "var(--color-bg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
          m: { xs: 1, sm: 2 },
          display: "flex",
          flexDirection: "column",
          ...(showPrescription
            ? {
                borderRadius: "var(--radius-lg)",
                width: "100%",
                maxWidth: {
                  xs: "calc(100% - 16px)",
                  md: "92vw",
                  lg: "1280px",
                },
                maxHeight: "92vh",
                height: { xs: "92vh", md: "86vh" },
              }
            : {
                borderRadius: "16px",
                width: "100%",
                maxWidth: { xs: "calc(100% - 16px)", sm: 480 },
                maxHeight: { xs: "90vh", sm: "85vh" },
              }),
        },
      }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 sm:px-5">
        <div className="min-w-0 pr-3">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2
              id="lab-add-test-title"
              className="text-base font-bold tracking-tight text-[var(--color-text)] sm:text-lg"
            >
              {viewOnly ? "Patient Test Details" : "Add Tests for Patient"}
            </h2>
            {isClinicVariant && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                <FaClinicMedical className="text-[11px]" /> Clinic Referral
              </span>
            )}
            {!isClinicVariant && isSelf && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <FaUser className="text-[11px]" /> Self Booking
              </span>
            )}
            {!isClinicVariant && !isSelf && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                <FaUser className="text-[11px]" /> Patient Direct
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              {row.patient_name}
              {row.gender && ` (${row.gender.toUpperCase().charAt(0)})`}
            </span>
            {row.contact_no && (
              <span className="flex items-center gap-1">
                <FaPhoneAlt className="text-[10px] opacity-70" />
                {row.contact_no}
              </span>
            )}
            {isClinicVariant && (row.clinic_name || row.doctor_name) && (
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
            flexShrink: 0,
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

      {/* Body */}
      <DialogContent
        dividers
        sx={{
          p: 0,
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: bothPanels || prescriptionOnly ? "hidden" : "auto",
          backgroundColor: "var(--color-bg)",
        }}
      >
        {bothPanels ? (
          <>
            {isMobile && (
              <div className="flex shrink-0 gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                <button
                  type="button"
                  onClick={() => setMobileTab("prescription")}
                  className={tabClass(mobileTab === "prescription")}
                >
                  <FaFilePrescription /> Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab("tests")}
                  className={tabClass(mobileTab === "tests")}
                >
                  <FaFlask /> Tests
                </button>
              </div>
            )}

            <div className="flex min-h-0 flex-1 overflow-hidden">
              {(!isMobile || mobileTab === "prescription") && (
                <div
                  className={`h-full min-h-0 overflow-hidden bg-[var(--color-surface)] ${
                    isMobile
                      ? "w-full"
                      : "w-[56%] border-r border-[var(--color-border)]"
                  }`}
                >
                  {prescriptionPanel}
                </div>
              )}
              {(!isMobile || mobileTab === "tests") && (
                <div
                  className={`h-full min-h-0 overflow-y-auto bg-[var(--color-bg)] ${
                    isMobile ? "w-full" : "w-[44%]"
                  }`}
                >
                  {testContent}
                </div>
              )}
            </div>
          </>
        ) : prescriptionOnly ? (
          <div className="h-full min-h-0 flex-1 overflow-hidden bg-[var(--color-surface)]">
            {prescriptionPanel}
          </div>
        ) : (
          testContent
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 3 },
          py: 1.5,
          gap: 1,
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
            borderRadius: "10px",
            minHeight: 40,
            px: 3,
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
              borderRadius: "10px",
              minHeight: 40,
              px: 3.5,
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
