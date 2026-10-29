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
  Divider,
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
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PdfViewerDialog from "../../../components/common/PdfViewerDialog";
import type { LabQueueRow, LabQueueTest } from "./LabQueueTypes";

interface LabTestDetailsDialogProps {
  open: boolean;
  row: LabQueueRow | null;
  pdfUrl: string | null;
  pdfLoading: boolean;
  onClose: () => void;
  onAddMoreTests?: (row: LabQueueRow) => void;
}

const getTestPricing = (test: any) => {
  const actual = Number(test.test_price ?? test.price ?? test.actual_price ?? 0);
  const discount = Number(test.discount_price ?? test.discount_amount ?? 0);
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
  onAddMoreTests,
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
    const payable =
      isPackage && row?.package_price != null
        ? Number(row.package_price)
        : assignedTests.reduce((sum, t) => sum + getTestPricing(t).payable, 0);

    return { totalActual: actual, totalDiscount: discount, totalPayable: payable };
  }, [assignedTests, isPackage, row?.package_price]);

  if (!row) return null;

  const isPaid = String(row.is_fee_paid) === "1";
  const isProcessing = row.result_status === "Processing";

  // Test cards content formatted consistent with Service Management
  const testsSection = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Section Title & Count */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]/40">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
            <FaFlask className="text-[var(--color-primary)] text-sm sm:text-base" />
            <span>Assigned Tests & Services</span>
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Tests and packages assigned to this patient appointment
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
          {isPackage ? "Package Booking" : `${assignedTests.length} ${assignedTests.length === 1 ? "Test" : "Tests"}`}
        </span>
      </div>

      {/* Package Notice (if applicable) */}
      {isPackage && (
        <div className="p-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
              <span>Laboratory Package</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary)] text-white shadow-2xs">
              {row.package_name || row.package_code || "Package"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h4 className="text-base font-bold text-slate-800">
              {row.package_name || "Special Health Package"}
            </h4>
            {row.package_code && (
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {row.package_code}
              </span>
            )}
            {row.package_total_tests ? (
              <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                {row.package_total_tests} Tests Included
              </span>
            ) : null}
          </div>

          {row.package_description && (
            <p className="text-xs text-slate-500 mt-1">
              {row.package_description}
            </p>
          )}

          {/* Package Pricing Breakdown */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-3">
              {row.package_actual_price != null && (
                <span className="text-slate-500">
                  Actual Total:{" "}
                  <span className="font-semibold text-slate-700">
                    ₹{Number(row.package_actual_price).toFixed(2)}
                  </span>
                </span>
              )}
              {row.package_discount_amount != null &&
                Number(row.package_discount_amount) > 0 && (
                  <span className="text-emerald-600 font-semibold">
                    Discount: −₹{Number(row.package_discount_amount).toFixed(2)}
                  </span>
                )}
            </div>

            {row.package_price != null && (
              <span className="text-sm font-bold text-[var(--color-primary)]">
                Package Price: ₹{Number(row.package_price).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tests List - Styled consistent with Service Management */}
      {assignedTests.length > 0 ? (
        <div className="space-y-2.5">
          {assignedTests.map((test, index) => {
            const { actual, discount, payable } = getTestPricing(test);
            const testName =
              test.test_name || test.name || `Lab Test #${test.test_id ?? index + 1}`;
            const testCode = test.test_code || (test as any).code;
            const categoryName =
              test.category_name || (test as any).category;

            return (
              <div
                key={`test-${test.test_id ?? index}-${index}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-[var(--color-primary)]/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Index badge + Name + Code + Category */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary)]/20">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm sm:text-[15px] text-slate-800 truncate">
                      {testName}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {testCode && (
                        <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                          {testCode}
                        </span>
                      )}
                      {categoryName && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {categoryName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actual Price, Discount, and Payable Amount */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-right pl-10 sm:pl-0">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <span className="text-xs text-slate-500">
                      Actual:{" "}
                      <span className="font-medium text-slate-700">
                        ₹{actual.toFixed(2)}
                      </span>
                    </span>
                    {discount > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Discount: −₹{discount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] whitespace-nowrap border border-[var(--color-primary)]/20 shadow-2xs">
                      = ₹{payable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <ScienceOutlinedIcon
            sx={{
              fontSize: 36,
              color: "var(--color-disabled)",
              mb: 1,
            }}
          />
          <p className="text-sm font-semibold text-slate-700">
            No tests found
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            There are currently no tests or packages recorded for this appointment.
          </p>
        </div>
      )}

      {/* Summary Total Card consistent with Service Management */}
      {assignedTests.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <span>Total Services:</span>
            <span className="font-bold text-slate-800">
              {assignedTests.length} {assignedTests.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <span>Actual Amount:</span>
            <span className="font-medium text-slate-700">
              ₹{totalActual.toFixed(2)}
            </span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-600">
              <span>Total Discount:</span>
              <span className="font-bold">−₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-800">
                Net Payable:
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isPaid ? (
                  <FaCheckCircle className="text-[10px]" />
                ) : (
                  <FaClock className="text-[10px]" />
                )}
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
          borderRadius: 3,
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
                <div className="w-full md:w-[54%] h-full min-h-0 border-r-0 md:border-r border-[var(--color-border)] flex flex-col bg-[var(--color-surface)]">
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
                <div className="w-full md:w-[46%] h-full min-h-0 flex flex-col bg-[var(--color-bg)]">
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

        <div className="flex items-center gap-2">
          {isProcessing && onAddMoreTests && (
            <Button
              onClick={() => onAddMoreTests(row)}
              variant="outlined"
              size="medium"
              sx={{
                borderRadius: "var(--radius-lg)",
                px: 2.5,
                py: 0.8,
                fontWeight: 600,
                textTransform: "none",
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                "&:hover": {
                  borderColor: "var(--color-primary-dark)",
                  backgroundColor: "rgba(2, 132, 199, 0.08)",
                },
              }}
            >
              Add / Manage Tests
            </Button>
          )}

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
        </div>
      </DialogActions>
    </Dialog>
  );
}
