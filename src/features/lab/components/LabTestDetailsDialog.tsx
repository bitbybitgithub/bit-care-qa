import { Chip, Dialog, Typography } from "@mui/material";
import { FaTimes } from "react-icons/fa";
import type { LabQueueRow, LabQueueTest } from "./LabQueueTypes";

interface LabTestDetailsDialogProps {
  row: LabQueueRow | null;
  onClose: () => void;
}

const money = (amount: unknown) => Number(amount || 0).toFixed(2);

function TestPriceList({ tests }: { tests: LabQueueTest[] }) {
  return (
    <div className="grid gap-2">
      {tests.map((test, index) => (
        <div
          key={test.test_id ?? index}
          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
        >
          <span>
            {test.test_name || test.name || `Test ${test.test_id ?? ""}`}
          </span>
          <span className="font-semibold text-slate-800">
            ₹{money(test.test_price)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TestDetails({ row }: { row: LabQueueRow }) {
  const isPackage =
    row.is_package === "1" ||
    row.is_package === 1 ||
    Boolean(row.package_id || row.package_name || row.package_code);

  if (isPackage) {
    const tests = Array.isArray(row.package_tests) ? row.package_tests : [];
    const totalTests = row.package_total_tests || tests.length || 0;
    const discount = Number(row.package_discount_amount || 0);
    const discountPercentage = Number(row.package_discount_percentage || 0);

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
              Package
            </span>
            <Chip
              size="small"
              label={`${totalTests} ${totalTests === 1 ? "test" : "tests"}`}
              sx={{
                backgroundColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
                fontWeight: 700,
              }}
            />
          </div>
          <p className="text-lg font-bold text-slate-900">
            {row.package_name || row.package_code || "Unnamed package"}
          </p>
          {row.package_description && (
            <p className="mt-1 text-sm text-slate-600">
              {row.package_description}
            </p>
          )}
        </div>
        {tests.length ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Included tests
            </p>
            <TestPriceList tests={tests} />
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No package test details available.
          </div>
        )}
        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Actual Amount</span>
            <span className="font-semibold">
              ₹{money(row.package_actual_price)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Discount{discountPercentage > 0 ? ` (${discountPercentage}%)` : ""}
              </span>
              <span className="font-semibold">- ₹{money(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-blue-200 pt-3 text-base font-bold text-slate-900">
            <span>Total Amount</span>
            <span className="text-blue-700">₹{money(row.package_price)}</span>
          </div>
        </div>
      </div>
    );
  }

  const tests = Array.isArray(row.test_details) ? row.test_details : [];
  const total = tests.reduce(
    (sum, test) => sum + Number(test.test_price || 0),
    0,
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
            Test
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            Individual test{tests.length === 1 ? "" : "s"}
          </p>
        </div>
        <Chip
          size="small"
          label={`${tests.length} ${tests.length === 1 ? "test" : "tests"}`}
          sx={{
            backgroundColor: "var(--color-surface-alt)",
            color: "var(--color-success)",
            fontWeight: 700,
          }}
        />
      </div>
      {tests.length ? (
        <>
          <TestPriceList tests={tests} />
          <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-800">
              Total Amount
            </span>
            <span className="text-base font-bold text-emerald-700">
              ₹{total.toFixed(2)}
            </span>
          </div>
        </>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
          No test details available.
        </p>
      )}
    </div>
  );
}

export default function LabTestDetailsDialog({
  row,
  onClose,
}: LabTestDetailsDialogProps) {
  const hasPackage =
    row?.is_package === "1" ||
    row?.is_package === 1 ||
    Boolean(row?.package_id || row?.package_name || row?.package_code);
  const title = hasPackage ? "Package details" : "Test details";

  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: "var(--color-bg)",
          overflow: "hidden",
        },
      }}
    >
      <div>
        <div className="flex items-center justify-between bg-[var(--color-primary)] px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              Order details
            </p>
            <h2 className="mt-1 text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-surface-alt)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]"
            aria-label="Close tests and package dialog"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-5">
          {row ? (
            <TestDetails row={row} />
          ) : (
            <Typography color="text.secondary">
              No test details available.
            </Typography>
          )}
        </div>
      </div>
    </Dialog>
  );
}
