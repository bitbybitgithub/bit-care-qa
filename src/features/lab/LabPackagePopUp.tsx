import React, { useEffect, useMemo, useState, type JSX } from "react";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import BloodtypeOutlinedIcon from "@mui/icons-material/BloodtypeOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import type { SelectedPackageTest } from "../../types/labType/LabTestInterfaces";
import Loader from "../../components/shared/Loader/Loader";

interface LabPackagePopUpProps {
  open: boolean;
  onClose: () => void;
  savedLabTests: any[];
  selectedPackage: any | null;
  loading?: boolean;
  onRefresh: () => Promise<void>;
  onSavePackage: (packageData: {
    packageName: string;
    packageCode: string;
    description: string;
    packagePrice: number;
    selectedTests: any[];
    actualPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }) => Promise<void>;
}
const LabPackagePopUp: React.FC<LabPackagePopUpProps> = ({
  open,
  onClose,
  savedLabTests,
  selectedPackage,
  loading,
  onRefresh,
  onSavePackage,
}) => {
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [packageNameError, setPackageNameError] = useState("");
  const [packagePriceError, setPackagePriceError] = useState("");
  const [selectedTestError, setSelectedTestError] = useState("");
  const [packageCode, setPackageCode] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTests, setSelectedTests] = useState<SelectedPackageTest[]>([]);
  const packageAmount = Number(packagePrice || 0);
  const isEditMode = Boolean(selectedPackage);
  // useEffect(() => {
  //   if (!open) return;
  //   if (!selectedPackage) {
  //     // CREATE MODE
  //     setPackageName("");
  //     setPackageCode("");
  //     setDescription("");
  //     setSelectedTests([]);
  //     setPackagePrice("");
  //     setActualPrice(0);
  //     setDiscountAmount(0);
  //     setDiscountPercentage(0);
  //     return;
  //   }
  //   // EDIT MODE
  //   setPackageName(selectedPackage.package_name || "");
  //   setPackageCode(selectedPackage.package_code || "");
  //   setDescription(selectedPackage.description || "");
  //   setPackagePrice(String(selectedPackage.package_price || ""));
  //   setActualPrice(Number(selectedPackage.actual_price || 0));
  //   setDiscountAmount(Number(selectedPackage.discount_amount || 0));
  //   setDiscountPercentage(Number(selectedPackage.discount_percentage || 0));
  //   const packageTests = selectedPackage.tests || [];
  //   const selectedPackageTests = packageTests.map((test: any) => ({
  //     test_id: String(test.test_id),
  //     test_code: test.test_code,
  //     test_name: test.test_name,
  //     category_id: Number(test.category_id),
  //     category_name: test.category_name,
  //     price: String(test.price ?? test.test_price ?? 0),
  //   }));
  //   setSelectedTests(selectedPackageTests);
  // }, [open, selectedPackage]);

  const categoryIcons: Record<string, JSX.Element> = {
    Hematology: (
      <BloodtypeOutlinedIcon
        sx={{
          color: "#1976d2",
        }}
      />
    ),
    Biochemistry: (
      <ScienceOutlinedIcon
        sx={{
          color: "#2e7d32",
        }}
      />
    ),
    Microbiology: (
      <BiotechOutlinedIcon
        sx={{
          color: "#7b1fa2",
        }}
      />
    ),
    Immunology: (
      <HealthAndSafetyOutlinedIcon
        sx={{
          color: "#ef6c00",
        }}
      />
    ),
    Hormones: (
      <MedicationOutlinedIcon
        sx={{
          color: "#d32f2f",
        }}
      />
    ),
    "Urine & Stool": (
      <WaterDropOutlinedIcon
        sx={{
          color: "#f9a825",
        }}
      />
    ),
    Others: (
      <CategoryOutlinedIcon
        sx={{
          color: "#78909c",
        }}
      />
    ),
  };

  const totalTestPrice = useMemo(() => {
    return selectedTests.reduce(
      (total, test) => total + Number(test.price || 0),
      0,
    );
  }, [selectedTests]);

  const discount = useMemo(() => {
    return Math.max(totalTestPrice - packageAmount, 0);
  }, [totalTestPrice, packageAmount]);

  const savingPercentage = useMemo(() => {
    if (totalTestPrice === 0) return 0;

    return Math.round((discount / totalTestPrice) * 100);
  }, [discount, totalTestPrice]);

  const categories = useMemo(() => {
    return [...new Set(savedLabTests.map((item) => item.category_name))];
  }, [savedLabTests]);

  React.useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  const filteredTests = useMemo(() => {
    return savedLabTests.filter(
      (x) =>
        x.category_name === activeCategory &&
        x.test_name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [savedLabTests, activeCategory, search]);

  const handleToggle = (test: SelectedPackageTest) => {
    setSelectedTests((prev) => {
      const exists = prev.some((item) => item.test_id === test.test_id);
      if (exists) {
        return prev.filter((item) => item.test_id !== test.test_id);
      }
      return [...prev, test];
    });
  };

  const isChecked = (id: number) =>
    selectedTests.some((item) => item.test_id === id);

  const currentCategoryTests = useMemo(
    () => savedLabTests.filter((x) => x.category_name === activeCategory),
    [savedLabTests, activeCategory],
  );

  const isAllSelected =
    currentCategoryTests.length > 0 &&
    currentCategoryTests.every((test) =>
      selectedTests.some((selected) => selected.test_id === test.test_id),
    );

  const isIndeterminate =
    selectedTests.some((selected) =>
      currentCategoryTests.some((test) => test.test_id === selected.test_id),
    ) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests((prev) => {
        const existingIds = new Set(prev.map((x) => x.test_id));

        const newTests = currentCategoryTests.filter(
          (test) => !existingIds.has(test.test_id),
        );

        return [...prev, ...newTests];
      });
    } else {
      setSelectedTests((prev) =>
        prev.filter(
          (selected) =>
            !currentCategoryTests.some(
              (test) => test.test_id === selected.test_id,
            ),
        ),
      );
    }
  };
  const validatePackage = () => {
    let valid = true;
    setPackageNameError("");
    setPackagePriceError("");
    setSelectedTestError("");
    if (!packageName.trim()) {
      setPackageNameError("Package name is required.");
      valid = false;
    }
    if (!packagePrice) {
      setPackagePriceError("Package price is required.");
      valid = false;
    } else if (Number(packagePrice) <= 0) {
      setPackagePriceError("Package price must be greater than zero.");
      valid = false;
    }
    if (selectedTests.length < 2) {
      setSelectedTestError("Select at least two tests.");
      valid = false;
    }
    if (Number(packagePrice) > totalTestPrice) {
      setPackagePriceError("Package price cannot exceed total test price.");
      valid = false;
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validatePackage()) return;
    await onSavePackage({
      packageName,
      packageCode,
      description,
      packagePrice: Number(packagePrice),
      selectedTests,
      actualPrice: totalTestPrice,
      discountAmount: discount,
      discountPercentage: savingPercentage,
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={() => onClose()} maxWidth="xl" fullWidth>
        <DialogTitle>
          Create New Package
          <IconButton
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
            }}
            onClick={() => onClose()}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            height: "82vh",
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* <Loader message="Loading package data..." /> */}
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Box>
      {/* Empty State */}
      {savedLabTests.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          {/* <Typography variant="h6">No Tests Available</Typography> */}

          {/* <Typography mt={1} color="text.secondary">
            Please add laboratory tests before creating a package.
          </Typography> */}
        </Paper>
      ) : (
        <Paper
          sx={{
            p: 5,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          {/* Package list will come here. */}
        </Paper>
      )}

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => onClose()}
        maxWidth="xl"
        fullWidth
        className="bg-white"
      >
        <DialogTitle>
          Create New Package
          <IconButton
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
            }}
            onClick={() => onClose()}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 0,
            height: "82vh",
          }}
        >
          <Box
            sx={{
              display: "flex",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* ================= LEFT ================= */}
            <Box
              sx={{
                width: 260,
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #e5e7eb",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2.5,
                  borderBottom: "1px solid #e5e7eb",
                  bgcolor: "#fff",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Test Categories
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {categories.length} Categories
                </Typography>
              </Box>

              {/* Category List */}

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                <List disablePadding>
                  {categories.map((category) => {
                    const totalTests = savedLabTests.filter(
                      (item) => item.category_name === category,
                    ).length;

                    const selectedCount = selectedTests.filter(
                      (item) => item.category_name === category,
                    ).length;

                    return (
                      <ListItemButton
                        key={category}
                        selected={activeCategory === category}
                        onClick={() => setActiveCategory(category)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderBottom: "1px solid #f2f2f2",
                          borderLeft: "4px solid transparent",

                          "&.Mui-selected": {
                            bgcolor: "#EEF4FF",
                            borderLeftColor: "#1976d2",
                          },

                          "&.Mui-selected:hover": {
                            bgcolor: "#EEF4FF",
                          },

                          "&:hover": {
                            bgcolor: "#f7faff",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                          width="100%"
                        >
                          {/* Icon */}

                          <Box>
                            {categoryIcons[category] ?? (
                              <CategoryOutlinedIcon color="disabled" />
                            )}
                          </Box>

                          {/* Category */}

                          <Box flex={1}>
                            <Typography fontWeight={600} fontSize={14} noWrap>
                              {category}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {totalTests} Tests
                            </Typography>
                          </Box>

                          {/* Badge */}

                          <Chip
                            size="small"
                            label={`${selectedCount}/${totalTests}`}
                            color={
                              selectedCount === totalTests && totalTests > 0
                                ? "success"
                                : "default"
                            }
                            sx={{
                              minWidth: 48,
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            </Box>

            {/* ================= MIDDLE ================= */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                bgcolor: "#fff",
                borderRight: "1px solid #e5e7eb",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                  flexShrink: 0,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      Available Tests
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {activeCategory}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    placeholder="Search test..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                      width: 260,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    {currentCategoryTests.length} Test(s) •{" "}
                    {
                      selectedTests.filter(
                        (x) => x.category_name === activeCategory,
                      ).length
                    }{" "}
                    Selected
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    }
                    label="Select All"
                  />
                </Stack>
              </Box>
              {/* Test List */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  bgcolor: "#fafafa",
                }}
              >
                {filteredTests.length === 0 ? (
                  <Paper
                    sx={{
                      p: 6,
                      textAlign: "center",
                      borderRadius: 3,
                    }}
                  >
                    <Typography color="text.secondary">
                      No tests found.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={1.5}>
                    {filteredTests.map((test) => (
                      <Paper
                        key={test.test_id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          transition: ".2s",

                          "&:hover": {
                            borderColor: "primary.main",
                            boxShadow: 2,
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          {/* Left */}

                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Checkbox
                              checked={isChecked(test.test_id)}
                              onChange={() => handleToggle(test)}
                            />

                            <Box>
                              <Typography fontWeight={600}>
                                {test.test_name}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {test.test_code}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Right */}

                          <Stack
                            direction="row"
                            spacing={4}
                            alignItems="center"
                          >
                            <Box textAlign="center">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Price
                              </Typography>

                              <Typography fontWeight={700}>
                                ₹{test.price}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>

            {/* ================= RIGHT ================= */}
            <Box
              sx={{
                width: 400,
                display: "flex",
                flexDirection: "column",
                bgcolor: "#fafafa",
              }}
            >
              {/* Header */}

              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #e5e7eb",
                  bgcolor: "#fff",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Package Builder
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Configure your laboratory package
                </Typography>
              </Box>

              {/* Content */}

              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {/* Package Name */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Package Name"
                  value={packageName}
                  error={Boolean(packageNameError)}
                  helperText={packageNameError}
                  onChange={(e) => {
                    setPackageName(e.target.value);
                    if (packageNameError) setPackageNameError("");
                  }}
                />

                {/* Package Price */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Package Price"
                  value={packagePrice}
                  error={Boolean(packagePriceError)}
                  helperText={packagePriceError}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setPackagePrice(value);
                      if (packagePriceError) setPackagePriceError("");
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />

                {/* Summary */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Typography fontWeight={700} mb={2}>
                    Package Summary
                  </Typography>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">
                        Selected Tests
                      </Typography>

                      <Typography fontWeight={600}>
                        {selectedTests.length}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">
                        Total Test Price
                      </Typography>

                      <Typography fontWeight={600}>
                        ₹{totalTestPrice}
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">
                        Package Price
                      </Typography>

                      <Typography fontWeight={600}>₹{packageAmount}</Typography>
                    </Stack>

                    <Divider />

                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={700}>Discount</Typography>

                      <Typography fontWeight={700} color="success.main">
                        ₹{discount}
                        {discount > 0 && (
                          <Chip
                            color="success"
                            size="small"
                            label={`Save ${savingPercentage}%`}
                          />
                        )}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Selected Tests */}
                <Paper
                  variant="outlined"
                  sx={{
                    flex: 1,
                    overflow: "hidden",
                    p: 2,
                    borderRadius: 2,
                    minHeight: 180,
                    display: "flex-start",
                    flexDirection: "column",
                  }}
                >
                  <Typography fontWeight={700} mb={2}>
                    Selected Tests
                    {selectedTestError && (
                      <Typography color="error" fontSize={12} mb={1}>
                        {selectedTestError}
                      </Typography>
                    )}
                  </Typography>

                  {selectedTests.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No tests selected.
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        pr: 0.5,
                        maxHeight: 180,
                      }}
                    >
                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={1}
                        alignItems="flex-start"
                      >
                        {selectedTests.map((test) => (
                          <Chip
                            key={test.test_id}
                            size="small"
                            label={test.test_code}
                            color="primary"
                            variant="outlined"
                            onDelete={() =>
                              setSelectedTests((prev) =>
                                prev.filter(
                                  (item) => item.test_id !== test.test_id,
                                ),
                              )
                            }
                            sx={{
                              borderRadius: "16px",
                              fontWeight: 500,
                              maxWidth: 180,
                              "& .MuiChip-label": {
                                px: 1,
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid #e5e7eb",
                  bgcolor: "#fff",
                }}
              >
                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => onClose()}
                  >
                    Cancel
                  </Button>
                  <Button fullWidth variant="contained" onClick={handleSave}>
                    Create Package
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
export default LabPackagePopUp;
