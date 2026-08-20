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
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import Loader from "../../components/shared/Loader/Loader";
import { saveAvailableLabApi } from "../../api/labApis/LabApi";
import type {
  LabCategory,
  LabTestItemRequest,
  SelectedTest,
} from "../../types/labType/LabTestInterfaces";

interface LabTestSelectionPopupProps {
  open: boolean;
  onClose: () => void;
  labTests: LabCategory[];
  selectedTests: SelectedTest[];
  labId: number | string;
  userId: number | string;
  doorStepService: boolean;
  onSaved: () => Promise<void>;
}
const LabTestSelectionPopup: React.FC<LabTestSelectionPopupProps> = ({
  open,
  onClose,
  labTests,
  selectedTests,
  labId,
  userId,
  doorStepService,
  onSaved,
}) => {
  console.log("Lab test", labTests);
  console.log("selected test", selectedTests);
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [newSelectedTests, setNewSelectedTests] = useState<SelectedTest[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNewSelectedTests([]);
      setSearch("");
      setActiveCategory(0);
    }
  }, [open]);

  const existingTestIds = useMemo(() => {
    return new Set(selectedTests.map((test) => String(test.testId)));
  }, [selectedTests]);

  const availableCategories = useMemo(() => {
    return labTests
      .map((category) => {
        const availableTests = category.tests.filter(
          (test) =>
            !selectedTests.some(
              (selected) => String(selected.testId) === String(test.id),
            ),
        );

        return {
          ...category,
          tests: availableTests,
        };
      })
      .filter((category) => category.tests.length > 0);
  }, [labTests, selectedTests]);
  const currentCategory = availableCategories[activeCategory];

  const filteredTests = useMemo(() => {
    if (!currentCategory) {
      return [];
    }
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return currentCategory.tests;
    }
    return currentCategory.tests.filter(
      (test) =>
        test.name.toLowerCase().includes(keyword) ||
        test.code?.toLowerCase().includes(keyword),
    );
  }, [currentCategory, search]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setActiveCategory(0);
      return;
    }
    if (activeCategory >= availableCategories.length) {
      setActiveCategory(availableCategories.length - 1);
    }
  }, [availableCategories, activeCategory]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setActiveCategory(0);
      return;
    }
    if (activeCategory >= availableCategories.length) {
      setActiveCategory(availableCategories.length - 1);
    }
  }, [availableCategories, activeCategory]);

  const isSelected = (testId: string) => {
    return newSelectedTests.some(
      (test) => String(test.testId) === String(testId),
    );
  };

  const handleToggle = (category: LabCategory, test: any, checked: boolean) => {
    if (checked) {
      setNewSelectedTests((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item.testId) === String(test.id),
        );
        if (alreadyExists) {
          return prev;
        }
        return [
          ...prev,
          {
            category: category.category,
            categoryId: test.categoryId,
            testId: test.id,
            testName: test.name,
            code: test.code,
            price: "",
            priceError: "",
          },
        ];
      });
    } else {
      setNewSelectedTests((prev) =>
        prev.filter((item) => String(item.testId) !== String(test.id)),
      );
    }
  };

  /*Selected category*/
  const isCategoryChecked = (category?: LabCategory) => {
    if (!category || category.tests.length === 0) {
      return false;
    }
    return category.tests.every((test) =>
      newSelectedTests.some(
        (selected) => String(selected.testId) === String(test.id),
      ),
    );
  };

  /*Select all */
  const handleSelectAll = (category: LabCategory, checked: boolean) => {
    if (checked) {
      setNewSelectedTests((prev) => {
        const existingIds = new Set(prev.map((test) => String(test.testId)));

        const newTests = category.tests
          .filter((test) => !existingIds.has(String(test.id)))
          .map((test) => ({
            category: category.category,
            categoryId: test.categoryId,
            testId: test.id,
            testName: test.name,
            code: test.code,
            price: "",
            priceError: "",
          }));

        return [...prev, ...newTests];
      });
    } else {
      const categoryIds = new Set(
        category.tests.map((test) => String(test.id)),
      );

      setNewSelectedTests((prev) =>
        prev.filter((test) => !categoryIds.has(String(test.testId))),
      );
    }
  };

  const handlePriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setNewSelectedTests((prev) =>
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

  const handleSaveNewTests = async () => {
    debugger;
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      if (newSelectedTests.length === 0) {
        toast.error("Please select at least one test");
        return;
      }
      const hasEmptyPrice = newSelectedTests.some(
        (test) => !test.price || test.price.trim() === "",
      );
      if (hasEmptyPrice) {
        toast.error("Please enter price for all selected tests");
        return;
      }
      const hasInvalidPrice = newSelectedTests.some((test) => {
        const price = Number(test.price);
        return isNaN(price) || price < 5 || price > 10000;
      });
      if (hasInvalidPrice) {
        toast.error("Price for every test must be between ₹5 and ₹10,000");
        return;
      }
      const payload: LabTestItemRequest = {
        lab_id: Number(labId),
        tests: newSelectedTests.map((test) => ({
          test_id: Number(test.testId),
          category_id: Number(test.categoryId),
          price: Number(test.price),
        })),
        created_by: Number(userId),
      };
      setSaving(true);
      const response = await saveAvailableLabApi(payload);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success(response.message);
      await onSaved();
      setNewSelectedTests([]);
      setSearch("");
      onClose();
    } catch (error) {
      console.error("Save new tests failed:", error);
      toast.error("Failed to save new laboratory tests");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: "100vh",
        },
      }}
    >
      {/* ================= TITLE ================= */}
      <DialogTitle
        sx={{
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Add New Tests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select tests that you want to add to your laboratory.
        </Typography>
      </DialogTitle>
      {/* ================= CONTENT ================= */}
      <DialogContent
        sx={{
          p: 2,
          overflow: "hidden",
        }}
      >
        {availableCategories.length === 0 ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Box>
              <ScienceOutlinedIcon
                sx={{
                  fontSize: 50,
                  color: "text.disabled",
                  mb: 1,
                }}
              />
              <Typography variant="h6" fontWeight={600}>
                All Tests Already Added
              </Typography>
              <Typography color="text.secondary">
                There are no new tests available to add.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Stack direction="row" spacing={2} height="100%">
            {/* ================= LEFT CATEGORY ================= */}
            <Paper
              variant="outlined"
              sx={{
                width: 320,
                flexShrink: 0,
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Category Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                  flexShrink: 0,
                  backgroundColor: "#f8fbff",
                }}
              >
                <Typography fontWeight={700} fontSize={20}>
                  Categories
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontSize={16}
                >
                  Available tests
                </Typography>
              </Box>
              {/* Category List */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: 6,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#f8fafc",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#94a3b8",
                    borderRadius: 10,
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#64748b",
                  },
                  scrollbarWidth: "thin",
                  scrollbarColor: "#94a3b8 #f8fafc",
                }}
              >
                <Tabs
                  orientation="vertical"
                  value={activeCategory}
                  onChange={(_, value) => setActiveCategory(value)}
                  sx={{
                    width: "100%",
                    "& .MuiTabs-indicator": {
                      left: 0,
                      right: "auto",
                      width: 3,
                      borderRadius: "0 3px 3px 0",
                    },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      alignItems: "flex-start",
                      textAlign: "left",
                      minHeight: 65,
                      px: 2,
                      py: 1.5,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#075985",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: "#f0f9ff",
                      },
                      "&.Mui-selected": {
                        color: "#0284c7",
                        backgroundColor: "#eff6ff",
                        fontWeight: 700,
                      },
                    },
                  }}
                >
                  {availableCategories.map((category) => (
                    <Tab
                      key={category.category}
                      label={
                        <Box
                          sx={{
                            width: "100%",
                          }}
                        >
                          <Typography
                            fontSize={18}
                            fontWeight={600}
                            color="inherit"
                            sx={{
                              lineHeight: 1.4,
                            }}
                          >
                            {category.category}
                          </Typography>
                          <Typography
                            variant="caption"
                            fontSize={15}
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mt: 0.25,
                            }}
                          >
                            {category.tests.length} Available
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Box>
            </Paper>
            {/* ================= AVAILABLE TESTS ================= */}
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                >
                  {/* Category Info */}
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {currentCategory?.category}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {filteredTests.length} Available Tests
                    </Typography>
                  </Box>

                  {/* Search + Select All */}
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TextField
                      size="small"
                      placeholder="Search Test..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{
                        width: 300,
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#ffffff",
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
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isCategoryChecked(currentCategory)}
                          onChange={(e) =>
                            handleSelectAll(currentCategory, e.target.checked)
                          }
                        />
                      }
                      label={
                        <Typography fontWeight={600}>Select All</Typography>
                      }
                      sx={{
                        mr: 0,
                        whiteSpace: "nowrap",
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
              <Box
                sx={{
                  p: 2,
                  height: "calc(100% - 88px)",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: 7,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#cbd5e1",
                    borderRadius: 2,
                  },
                }}
              >
                <Stack spacing={1.5}>
                  {filteredTests.map((test) => {
                    const checked = isSelected(test.id);
                    const selected = newSelectedTests.find(
                      (item) => String(item.testId) === String(test.id),
                    );
                    return (
                      <Paper
                        key={test.id}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          borderColor: checked ? "primary.main" : "#e5e7eb",
                          backgroundColor: checked ? "#f5f9ff" : "#fff",
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Checkbox
                            checked={checked}
                            onChange={(e) =>
                              handleToggle(
                                currentCategory,
                                test,
                                e.target.checked,
                              )
                            }
                          />
                          <Box flex={1}>
                            <Typography fontWeight={600}>
                              {test.name}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={0.5}>
                              <Chip
                                label={test.code}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                          {selected && (
                            <TextField
                              size="small"
                              value={selected.price}
                              error={Boolean(selected.priceError)}
                              helperText={selected.priceError}
                              onChange={(e) =>
                                handlePriceChange(
                                  selected.testId,
                                  e.target.value,
                                )
                              }
                              sx={{
                                width: 130,
                                "& .MuiFormHelperText-root": {
                                  marginLeft: 0,
                                  fontSize: 10,
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
                          )}
                        </Stack>
                      </Paper>
                    );
                  })}
                  {filteredTests.length === 0 && (
                    <Box
                      sx={{
                        py: 8,
                        textAlign: "center",
                      }}
                    >
                      <Typography color="text.secondary">
                        No tests found.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Paper>
            {/* ================= SELECTED NEW TESTS ================= */}
            <Paper
              variant="outlined"
              sx={{
                width: 280,
                flexShrink: 0,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography fontWeight={700}>New Tests</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Selected to add
                    </Typography>
                  </Box>
                  <Chip
                    label={`${newSelectedTests.length}`}
                    size="small"
                    color="primary"
                  />
                </Stack>
              </Box>
              <Box
                sx={{
                  p: 2,
                  height: "calc(100% - 75px)",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: 7,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#cbd5e1",
                    borderRadius: 3,
                  },
                }}
              >
                {newSelectedTests.length === 0 ? (
                  <Box
                    sx={{
                      py: 8,
                      textAlign: "center",
                    }}
                  >
                    <ScienceOutlinedIcon
                      sx={{
                        fontSize: 40,
                        color: "text.disabled",
                        mb: 1,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No new tests selected.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {newSelectedTests.map((test) => (
                      <Paper
                        key={test.testId}
                        variant="outlined"
                        sx={{
                          p: 1.25,
                        }}
                      >
                        <Typography fontWeight={600} fontSize={14}>
                          {test.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ₹{test.price || "0"}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Stack>
        )}
      </DialogContent>
      {/* ================= FOOTER ================= */}
      <Divider />
      <DialogActions
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveNewTests}
          disabled={
            saving ||
            newSelectedTests.length === 0 ||
            newSelectedTests.some(
              (test) => !test.price || Boolean(test.priceError),
            )
          }
        >
          {saving
            ? "Saving..."
            : newSelectedTests.length > 0
              ? `${newSelectedTests.length} Confirm`
              : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabTestSelectionPopup;
