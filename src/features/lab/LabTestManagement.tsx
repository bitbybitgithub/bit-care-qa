import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import Loader from "../../components/shared/Loader/Loader";
import { updateAvailableLabTestApi } from "../../api/labApis/LabApi";
import type {
  SelectedTest,
  LabTestItemRequest,
  UpdateLabTestItemRequest,
} from "../../types/labType/LabTestInterfaces";

interface LabTestManagementProps {
  data: {
    selectedTests: SelectedTest[];
    search: string;
  };
  loading?: boolean;
  actions: {
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedTests: React.Dispatch<React.SetStateAction<SelectedTest[]>>;
  };
  labId: number | string;
  userId: number | string;
  onUpdated: () => Promise<void>;
  onAddNewTest: () => void;
}

const LabTestManagement: React.FC<LabTestManagementProps> = ({
  data,
  loading = false,
  actions,
  labId,
  userId,
  onUpdated,
  onAddNewTest,
}) => {
  const { selectedTests, search } = data;
  const { setSearch, setSelectedTests } = actions;
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testToDelete, setTestToDelete] = useState<SelectedTest | null>(null);
  const [baselineTests, setBaselineTests] = useState<SelectedTest[]>([]);

  useEffect(() => {
    const currentIds = selectedTests
      .map((test) => String(test.testId))
      .sort()
      .join(",");
    const baselineIds = baselineTests
      .map((test) => String(test.testId))
      .sort()
      .join(",");

    if (currentIds !== baselineIds) {
      setBaselineTests(selectedTests.map((test) => ({ ...test })));
    }
  }, [selectedTests, baselineTests]);

  const categories = useMemo(() => {
    const categoryMap = new Map<
      number,
      {
        categoryId: number;
        category: string;
      }
    >();
    selectedTests.forEach((test) => {
      if (!categoryMap.has(test.categoryId)) {
        categoryMap.set(test.categoryId, {
          categoryId: Number(test.categoryId),
          category: test.category,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [selectedTests]);

  const currentCategory = categories[activeCategory];

  const filteredTests = useMemo(() => {
    if (!currentCategory) {
      return [];
    }
    const keyword = search.trim().toLowerCase();
    return selectedTests.filter((test) => {
      const matchesCategory =
        Number(test.categoryId) === Number(currentCategory.categoryId);
      const matchesSearch =
        !keyword ||
        test.testName.toLowerCase().includes(keyword) ||
        test.code?.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [selectedTests, currentCategory, search]);

  useEffect(() => {
    if (activeCategory >= categories.length) {
      setActiveCategory(Math.max(0, categories.length - 1));
    }
  }, [categories.length, activeCategory]);

  const handlePriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) {
          return test;
        }
        let priceError = "";
        if (value === "") {
          priceError = "Price is required";
        } else {
          const price = Number(value);
          if (price < 5) {
            priceError = "Minimum price is ₹5";
          } else if (price > 10000) {
            priceError = "Maximum price is ₹10,000";
          }
        }
        return {
          ...test,
          price: value,
          priceError,
        };
      }),
    );
  };

  const handleDeleteTest = (testId: string) => {
    const test = selectedTests.find(
      (item) => String(item.testId) === String(testId),
    );
    if (test) {
      setTestToDelete(test);
    }
  };

  const handlePriceFieldBlur = (testId: string) => {
    const currentTest = selectedTests.find(
      (item) => String(item.testId) === String(testId),
    );
    const priceValue = String(currentTest?.price ?? "").trim();

    if (!priceValue) {
      return;
    }

    const numericValue = Number(priceValue);
    if (
      Number.isNaN(numericValue) ||
      !/^\d*\.?\d{0,2}$/.test(priceValue) ||
      numericValue < 5 ||
      numericValue > 10000
    ) {
      return;
    }

    setEditingTestId((prev) => (prev === testId ? null : prev));
  };

  const submitLabTestChange = async (
    operationType: "U" | "D",
    testsToSubmit: SelectedTest[],
  ) => {
    if (!labId || !userId) {
      toast.error("Lab ID or user ID not found");
      return false;
    }
    const payload: UpdateLabTestItemRequest = {
      lab_id: Number(labId),
      operation_type: operationType,
      tests: testsToSubmit.map((test) => ({
        test_id: Number(test.testId),
        category_id: Number(test.categoryId),
        price: Number(test.price || 0),
        ...(operationType === "D"
          ? {
              is_active: "0",
            }
          : {}),
      })),
      modified_by: Number(userId),
    };

    const response = await updateAvailableLabTestApi(payload);
    if (!response.success) {
      toast.error(response.message);
      return false;
    }
    toast.success(
      response.message ||
        (operationType === "U"
          ? "Lab tests updated successfully"
          : "Lab test deleted successfully"),
    );
    return true;
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete || !labId || !userId) {
      return;
    }
    try {
      setDeleteLoading(true);
      const success = await submitLabTestChange("D", [testToDelete]);
      if (!success) {
        return;
      }
      setSelectedTests((prev) =>
        prev.filter(
          (test) => String(test.testId) !== String(testToDelete.testId),
        ),
      );
      setBaselineTests((prev) =>
        prev.filter(
          (test) => String(test.testId) !== String(testToDelete.testId),
        ),
      );
      setTestToDelete(null);
      setEditingTestId(null);
      await onUpdated();
    } catch (error) {
      console.error("Delete laboratory test failed:", error);
      toast.error("Failed to delete laboratory test");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateTests = async () => {
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      if (selectedTests.length === 0) {
        toast.error("No laboratory tests configured");
        return;
      }
      const dirtyTests = selectedTests.filter((test) => {
        const original = baselineTests.find(
          (item) => String(item.testId) === String(test.testId),
        );
        if (!original) {
          return true;
        }
        return (
          String(original.price ?? "") !== String(test.price ?? "") ||
          Number(original.categoryId) !== Number(test.categoryId) ||
          original.testName !== test.testName
        );
      });
      if (dirtyTests.length === 0) {
        toast.info("No test changes to save");
        return;
      }
      const hasEmptyPrice = dirtyTests.some(
        (test) => !test.price || test.price.trim() === "",
      );
      if (hasEmptyPrice) {
        toast.error("Please enter price for all edited tests");
        return;
      }
      const hasInvalidPrice = dirtyTests.some((test) => {
        const price = Number(test.price);
        return isNaN(price) || price < 5 || price > 10000;
      });
      if (hasInvalidPrice) {
        toast.error("Price for edited tests must be between ₹5 and ₹10,000");
        return;
      }
      setUpdateLoading(true);
      const success = await submitLabTestChange("U", dirtyTests);
      if (!success) {
        return;
      }
      setEditingTestId(null);
      await onUpdated();
      setBaselineTests(selectedTests.map((test) => ({ ...test })));
      setSearch("");
    } catch (error) {
      console.error("Update laboratory tests failed:", error);

      toast.error("Failed to update laboratory tests");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading laboratory services..." />;
  }
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        {/* ================= HEADER ================= */}
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Laboratory Tests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage tests available in your laboratory.
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              <Chip
                size="small"
                icon={<ScienceOutlinedIcon />}
                label={`${selectedTests.length} Tests`}
                color="primary"
              />
              <Chip
                size="small"
                label={`${categories.length} Categories`}
                variant="outlined"
              />
            </Stack>
          </Box>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search Test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: {
                  xs: "100%",
                  sm: 280,
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {/* Add New Test */}
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={onAddNewTest}
              sx={{
                whiteSpace: "nowrap",
              }}
            >
              Add New Test
            </Button>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {/* ================= CATEGORY TABS ================= */}
        {categories.length > 0 ? (
          <>
            <Tabs
              value={activeCategory}
              onChange={(_, value) => setActiveCategory(value)}
              sx={{
                mb: 3,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 50,
                  alignItems: "flex-start",
                },
              }}
            >
              {categories.map((category) => {
                const count = selectedTests.filter(
                  (test) =>
                    Number(test.categoryId) === Number(category.categoryId),
                ).length;

                return (
                  <Tab
                    key={category.categoryId}
                    label={
                      <Box textAlign="left">
                        <Typography fontWeight={600}>
                          {category.category}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {count} Tests
                        </Typography>
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
            {/* ================= TEST GRID ================= */}
            <Box
              sx={{
                maxHeight: "60vh",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: 7,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cbd5e1",
                  borderRadius: 5,
                },
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    lg: "1fr 1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                {filteredTests.map((test) => {
                  const isEditing = editingTestId === test.testId;
                  return (
                    <Paper
                      key={test.testId}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: 1,
                        },
                      }}
                    >
                      {/* Test Header */}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={1}
                      >
                        <Box flex={1} minWidth={0}>
                          <Typography
                            fontWeight={700}
                            noWrap
                            title={test.testName}
                          >
                            {test.testName}
                          </Typography>
                        </Box>
                        {/* Actions */}
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip
                            title={isEditing ? "Close Edit" : "Edit Test"}
                          >
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() =>
                                setEditingTestId(isEditing ? null : test.testId)
                              }
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Test">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTest(test.testId)}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      {/* Test Information */}
                      <Stack spacing={1.5}>
                        {/* Price */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" color="text.secondary">
                            Test Price
                          </Typography>
                          {isEditing ? (
                            <TextField
                              size="small"
                              value={test.price}
                              onChange={(e) =>
                                handlePriceChange(test.testId, e.target.value)
                              }
                              onBlur={() => handlePriceFieldBlur(test.testId)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handlePriceFieldBlur(test.testId);
                                }
                              }}
                              error={Boolean(test.priceError)}
                              helperText={test.priceError}
                              sx={{
                                width: 130,
                                "& .MuiFormHelperText-root": {
                                  fontSize: 10,
                                  marginLeft: 0,
                                },
                              }}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      ₹
                                    </InputAdornment>
                                  ),
                                },
                              }}
                            />
                          ) : (
                            <Typography fontWeight={700} color="primary">
                              ₹{test.price}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
              {/* No Search Result */}
              {filteredTests.length === 0 && (
                <Box
                  sx={{
                    py: 8,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    No Tests Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try changing your search.
                  </Typography>
                </Box>
              )}
            </Box>
            {/* ================= SAVE ================= */}
            <Stack direction="row" justifyContent="flex-end" mt={3}>
              <Button
                variant="contained"
                onClick={handleUpdateTests}
                disabled={updateLoading}
              >
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          </>
        ) : (
          /* ================= NO TESTS ================= */
          <Box
            sx={{
              py: 10,
              textAlign: "center",
            }}
          >
            <ScienceOutlinedIcon
              sx={{
                fontSize: 50,
                color: "text.disabled",
                mb: 1,
              }}
            />
            <Typography variant="h6" fontWeight={600}>
              No Laboratory Tests
            </Typography>
            <Typography color="text.secondary" mb={3}>
              No tests have been configured for this laboratory yet.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={onAddNewTest}
            >
              Add New Test
            </Button>
          </Box>
        )}
      </Paper>

      <Dialog
        open={Boolean(testToDelete)}
        onClose={() => setTestToDelete(null)}
        maxWidth="sm"
        className="text-center"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Test</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{" "}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>{testToDelete?.testName}?</strong>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setTestToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteTest}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete Test"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabTestManagement;
