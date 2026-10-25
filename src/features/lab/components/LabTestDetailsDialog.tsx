import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  FaTimes,
  FaFilePrescription,
  FaFlask,
  FaPhoneAlt,
  FaClinicMedical,
  FaUser,
  FaCheckCircle,
  FaClock,
  FaBoxes,
} from "react-icons/fa";
import PdfViewerDialog from "../../../components/common/PdfViewerDialog";
import type { LabQueueRow, LabQueueTest } from "./LabQueueTypes";

interface LabTestDetailsDialogProps {
  open: boolean;
  row: LabQueueRow | null;
  pdfUrl: string | null;
  pdfLoading: boolean;
  onClose: () => void;
}

const getTestPricing = (test: LabQueueTest) => {
  const actual = Number(test.test_price ?? test.price ?? 0);
  const discount = Number(test.discount_price ?? 0);
  const payable =
    test.payable_amount != null
      ? Number(test.payable_amount)
      : Math.max(0, actual - discount);
  return { actual, discount, payable };
};

export default function LabTestDetailsDialog({
  open,
  row,
  pdfUrl,
  pdfLoading,
  onClose,
}: LabTestDetailsDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileTab, setMobileTab] = useState<"prescription" | "tests">(
    "prescription",
  );

  const bookingSource = (row?.booking_source || "").toUpperCase();
  const isClinic = bookingSource === "CLINIC";
  const isSelf = bookingSource === "LAB";

  const isPackage = Boolean(
    row?.is_package === "1" ||
      row?.is_package === 1 ||
      row?.package_id ||
      row?.package_name ||
      row?.package_code,
  );

  const assignedTests: LabQueueTest[] = useMemo(() => {
    if (!row) return [];
    if (Array.isArray(row.test_details) && row.test_details.length > 0) {
      return row.test_details;
    }
    if (Array.isArray(row.package_tests) && row.package_tests.length > 0) {
      return row.package_tests;
    }
    return [];
  }, [row]);

  const { totalActual, totalDiscount, totalPayable } = useMemo(() => {
    const actual = assignedTests.reduce(
      (sum, t) => sum + getTestPricing(t).actual,
      0,
    );
    const discount = assignedTests.reduce(
      (sum, t) => sum + getTestPricing(t).discount,
      0,
    );
    const payable = isPackage && row?.package_price != null
      ? Number(row.package_price)
      : assignedTests.reduce((sum, t) => sum + getTestPricing(t).payable, 0);

    return { totalActual: actual, totalDiscount: discount, totalPayable: payable };
  }, [assignedTests, isPackage, row?.package_price]);

  if (!row) return null;

  const isPaid = String(row.is_fee_paid) === "1";

  // Test cards content
  const testsSection = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Section Title & Count */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]/40">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
            <FaFlask className="text-[var(--color-primary)] text-sm sm:text-base" />
            Selected Tests
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Current tests assigned to this patient
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
          {assignedTests.length} {assignedTests.length === 1 ? "Test" : "Tests"}
        </span>
      </div>

      {/* Package Notice (if applicable) */}
      {isPackage && (
        <div className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              <FaBoxes /> Package Included
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
          {row.package_actual_price != null && (
            <div className="mt-2 pt-2 border-t border-[var(--color-border)]/40 flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Package Actual Price:</span>
              <span className="font-semibold text-[var(--color-text)]">
                ₹{Number(row.package_actual_price).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Test List */}
      {assignedTests.length > 0 ? (
        <div className="space-y-2.5">
          {assignedTests.map((test, index) => {
            const { actual, discount, payable } = getTestPricing(test);
            return (
              <div
                key={`test-${test.test_id ?? index}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)] transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-[var(--color-text)]">
                      {test.test_name || test.name || `Lab Test #${test.test_id ?? index + 1}`}
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
                      Actual Price: <span className="font-medium text-[var(--color-text)]">₹{actual.toFixed(2)}</span>
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-[var(--color-success)] font-medium">
                        Discount: -₹{discount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[var(--color-primary)] sm:mt-1">
                    Payable Price: ₹{payable.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <FaFlask className="mx-auto text-3xl text-[var(--color-text-secondary)] opacity-40 mb-2" />
          <p className="text-sm font-semibold text-[var(--color-text)]">
            No tests found
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            There are currently no tests recorded for this appointment.
          </p>
        </div>
      )}

      {/* Summary Total Card */}
      {assignedTests.length > 0 && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <span>Total Tests:</span>
            <span className="font-semibold text-[var(--color-text)]">
              {assignedTests.length}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <span>Actual Amount:</span>
            <span className="font-medium text-[var(--color-text)]">
              ₹{totalActual.toFixed(2)}
            </span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--color-success)]">
              <span>Total Discount:</span>
              <span className="font-semibold">-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-[var(--color-border)]/50 pt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                Net Payable:
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isPaid ? <FaCheckCircle className="text-[10px]" /> : <FaClock className="text-[10px]" />}
                {isPaid ? "Paid" : "Payment Pending"}
              </span>
            </div>
            <span className="text-base sm:text-xl font-bold text-[var(--color-primary)]">
              ₹{totalPayable.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isClinic ? "xl" : "md"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-bg)",
          overflow: "hidden",
          width: isClinic
            ? { xs: "96vw", sm: "92vw", md: "90vw", lg: "86vw" }
            : { xs: "96vw", sm: "88vw", md: "680px", lg: "740px" },
          maxHeight: "92vh",
          height: isClinic ? { xs: "92vh", md: "86vh" } : "auto",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border)",
        },
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <div className="min-w-0 pr-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)] tracking-tight">
              Patient Test Details
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
        {isClinic ? (
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
                  <FaFlask /> Selected Tests ({assignedTests.length})
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
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Retrieving doctor&apos;s digital prescription
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-1">
                        <FaFilePrescription className="text-2xl" />
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base text-[var(--color-text)]">
                        No Prescription Document Available
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
                        The referring clinic has not uploaded a digital prescription for this appointment, or it is in physical format.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Selected Tests */}
              {(!isMobile || mobileTab === "tests") && (
                <div className="w-full md:w-[44%] h-full min-h-0 flex flex-col bg-[var(--color-bg)]">
                  {testsSection}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Single Column for Patient / Self Booking */
          <div className="max-h-[70vh] overflow-y-auto">
            {testsSection}
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
        <div className="text-xs text-[var(--color-text-secondary)] hidden sm:block">
          Appointment Date: {row.test_date || "Today"}
        </div>
        <Button
          onClick={onClose}
          variant="contained"
          size="medium"
          sx={{
            borderRadius: "var(--radius-lg)",
            px: 3,
            py: 0.8,
            fontWeight: 600,
            textTransform: "none",
            backgroundColor: "var(--color-primary)",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "var(--color-primary-dark)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
