import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
        console.log("getLabTestListApi", response);
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
  const showPrescription = Boolean(row?.prescription_url);
  const showTests = !viewOnly || assignedTests.length > 0 || hasPackage;

  const toggleTest = (test: AvailablePatientTest) => {
    setSelectedTests((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

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
      console.log("UpdatePatientTestsRequest payload:", payload);
      const response = await updatePatientTestsApi(payload);
      if (
        !response?.success ||
        response.success === "false" ||
        response.success === "0"
      ) {
        throw new Error(response?.message || "Failed to update patient tests");
      }
      console.log("UpdatePatientTestsResponse:", response);
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
  console.log("assignedTests", assignedTests);
  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          width: { xs: "96vw", md: "92vw" },
          maxHeight: "92vh",
          height: { xs: "92vh", md: "84vh" },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          py: 1.5,
        }}
      >
        <Box>
          {viewOnly ? "Patient Test Details" : "Add Tests for Patient"}
          <Typography variant="body2" color="text.secondary">
            {row?.patient_name}
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          p: 0,
          minHeight: 0,
          display: "flex",
          flexDirection:
            showPrescription && showTests
              ? { xs: "column", md: "row" }
              : "column",
        }}
      >
        {showPrescription && (
          <Box
            sx={{
              width: showTests ? { xs: "100%", md: "56%" } : "100%",
              height: showTests ? { xs: "50%", md: "100%" } : "100%",
              minHeight: 0,
              ...(showTests && {
                borderRight: { md: "1px solid var(--color-border)" },
                borderBottom: {
                  xs: "1px solid var(--color-border)",
                  md: 0,
                },
              }),
            }}
          >
            <PdfViewerDialog
              open={Boolean(row)}
              pdfUrl={pdfUrl}
              loading={pdfLoading}
              onClose={onClose}
              embedded
            />
            {!pdfLoading && !pdfUrl && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 2,
                  color: "text.secondary",
                }}
              >
                <Typography variant="body2">
                  Unable to load the prescription.
                </Typography>
              </Box>
            )}
          </Box>
        )}
        {showTests && (
          <Box
            sx={{
              width: showPrescription ? { xs: "100%", md: "44%" } : "100%",
              flex: showPrescription ? { xs: 1, md: "initial" } : 1,
              minHeight: 0,
              overflowY: "auto",
              p: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={1.5}>
              {viewOnly
                ? "Selected Tests"
                : assignedTests.length
                  ? "Current and Additional Tests"
                  : "Add Tests"}
            </Typography>
            {assignedTests.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Current tests
                </Typography>
                {assignedTests.map((test, index) => (
                  <Box
                    key={`current-${test.test_id ?? test.test_name ?? test.name}-${index}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      border: "1px solid var(--color-border)",
                      borderRadius: 2,
                      p: 1.5,
                      mb: 1,
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    <Typography fontWeight={600}>
                      {test.test_name || test.name || "Lab test"}
                    </Typography>

                    <Box sx={{ textAlign: "right", minWidth: 110 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        // sx={{ textDecoration: "line-through" }}
                      >
                        Actual Price: ₹{test.test_price?.toFixed(2)}
                      </Typography>

                      {test.discount_price > 0 && (
                        <Typography variant="body2" color="success.main">
                          Discount Amount: ₹{test.discount_price?.toFixed(2)}
                        </Typography>
                      )}

                      <Typography fontWeight={700} color="primary">
                        Payable Price: ₹{test.payable_amount?.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            {!viewOnly && (
              <TextField
                fullWidth
                size="small"
                placeholder="Search tests..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ mb: 2 }}
              />
            )}
            {!viewOnly && loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : viewOnly ? (
              assignedTests.length ? null : hasPackage ? (
                <Typography color="text.secondary">
                  Package: {row?.package_name || "Lab package"}
                  {row?.package_price != null &&
                    ` — ₹${Number(row.package_price).toFixed(2)}`}
                </Typography>
              ) : (
                <Typography color="text.secondary">
                  No tests are assigned to this patient.
                </Typography>
              )
            ) : filteredTests.length ? (
              <>
                {assignedTests.length > 0 && (
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>
                    Add additional tests
                  </Typography>
                )}
                <Box className="space-y-2">
                  {filteredTests.map((test) => (
                    <Box
                      key={test.test_id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        border: "1px solid var(--color-border)",
                        borderRadius: 2,
                        p: 1,
                        mb: 1,
                      }}
                    >
                      <Checkbox
                        checked={selectedTests.some(
                          (selected) => selected.test_id === test.test_id,
                        )}
                        onChange={() => toggleTest(test)}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600}>
                          {test.test_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {test.test_code || ""}
                          {test.category_name ? ` • ${test.category_name}` : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", minWidth: 110 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          // sx={{ textDecoration: "line-through" }}
                        >
                          Actual Price: ₹{test.price?.toFixed(2)}
                        </Typography>

                        {test.discount_price > 0 && (
                          <Typography variant="body2" color="success.main">
                            Discount Amount: ₹{test.discount_price?.toFixed(2)}
                          </Typography>
                        )}

                        <Typography fontWeight={700} color="primary">
                          Payable Price: ₹{test.payable_amount?.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary">
                No additional tests available.
              </Typography>
            )}
            {selectedTests.map((test) => (
              <Box
                key={test.test_id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  py: 1,
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {test.test_name}
                </Typography>

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Price: ₹{test.price.toFixed(2)}
                  </Typography>

                  <Typography variant="body2" color="success.main">
                    Discount: ₹{test.discount_price.toFixed(2)}
                  </Typography>

                  <Typography fontWeight={700} color="primary">
                    Payable: ₹{test.payable_amount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
        <Button onClick={onClose}>{viewOnly ? "Close" : "Cancel"}</Button>
        {!viewOnly && (
          <Button
            variant="contained"
            disabled={!selectedTests.length || saving || loading}
            onClick={saveTests}
          >
            {saving ? "Saving..." : `Save ${selectedTests.length} Test(s)`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
