import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import {
  getLabPackageListApi,
  getLabTestListApi,
} from "../../../api/labApis/LabApi";

export interface LabWalkInTest {
  test_id: number;
  category_id: number;
  test_name: string;
  test_code?: string;
  price: number;
  discount_price?: number;
  payable_amount?: number;
  category_name?: string;
}

export interface LabWalkInPackage {
  package_id: number;
  package_name: string;
  package_code?: string;
  package_price: number;
  actual_price?: number;
  discount_amount?: number;
  total_tests?: number;
  tests?: Array<{
    test_id: number;
    test_name?: string;
    test_code?: string;
    test_price?: number;
  }>;
}

interface Props {
  open: boolean;
  labId: number;
  onClose: () => void;
  selectedTests: LabWalkInTest[];
  selectedPackages?: LabWalkInPackage[];
  onConfirm: (tests: LabWalkInTest[], packages?: LabWalkInPackage[]) => void;
}

const LabWalkInTestSelectionPopup: React.FC<Props> = ({
  open,
  labId,
  onClose,
  selectedTests,
  selectedPackages = [],
  onConfirm,
}) => {
  const [tab, setTab] = useState<"tests" | "packages">("tests");
  const [tests, setTests] = useState<LabWalkInTest[]>([]);
  const [packages, setPackages] = useState<LabWalkInPackage[]>([]);
  const [selected, setSelected] = useState<LabWalkInTest[]>(selectedTests);
  const [selectedPackageIds, setSelectedPackageIds] = useState<number[]>(
    selectedPackages.map((pkg) => pkg.package_id),
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(selectedTests);
    setSelectedPackageIds(selectedPackages.map((pkg) => pkg.package_id));
    setSearch("");
    const loadTests = async () => {
      setLoading(true);
      try {
        const response = await getLabTestListApi(labId);
        console.log("response", response);
        const data = Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

        setTests(
          data.map((test: any) => {
            const price = Number(test.price ?? test.test_price ?? 0);
            const discountPrice = Number(test.discount_price ?? 0);

            return {
              test_id: Number(test.test_id),
              category_id: Number(test.category_id),
              test_name: test.test_name,
              test_code: test.test_code,
              price,
              discount_price: discountPrice,
              payable_amount:
                test.payable_amount != null
                  ? Number(test.payable_amount)
                  : Math.max(0, price - discountPrice),
              category_name: test.category_name,
            };
          }),
        );
      } finally {
        setLoading(false);
      }
    };
    void loadTests();
  }, [open, labId, selectedTests, selectedPackages]);

  useEffect(() => {
    if (!open || tab !== "packages" || !labId || packages.length) return;
    const loadPackages = async () => {
      setPackagesLoading(true);
      setPackagesError(null);
      try {
        const response = await getLabPackageListApi(labId);
        const rawPackages = Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
        setPackages(
          rawPackages.map((pkg: any) => ({
            package_id: Number(pkg.package_id),
            package_name: pkg.package_name,
            package_code: pkg.package_code,
            package_price: Number(pkg.package_price ?? pkg.packagePrice ?? 0),
            actual_price: Number(pkg.actual_price ?? pkg.actualPrice ?? 0),
            discount_amount: Number(
              pkg.discount_amount ?? pkg.discountAmount ?? 0,
            ),
            total_tests: Number(pkg.total_tests ?? pkg.tests?.length ?? 0),
            tests: Array.isArray(pkg.tests) ? pkg.tests : [],
          })),
        );
      } catch (error) {
        console.error("Failed to load lab packages", error);
        setPackagesError(
          "Unable to load packages right now. Please try again.",
        );
      } finally {
        setPackagesLoading(false);
      }
    };
    void loadPackages();
  }, [open, tab, labId, packages.length]);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tests;
    return tests.filter(
      (test) =>
        test.test_name.toLowerCase().includes(keyword) ||
        test.test_code?.toLowerCase().includes(keyword),
    );
  }, [search, tests]);

  const filteredPackages = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return packages;
    return packages.filter(
      (pkg) =>
        pkg.package_name.toLowerCase().includes(keyword) ||
        pkg.package_code?.toLowerCase().includes(keyword),
    );
  }, [search, packages]);

  const toggleTest = (test: LabWalkInTest) => {
    setSelected((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

  const togglePackage = (pkg: LabWalkInPackage) => {
    setSelectedPackageIds((current) =>
      current.includes(pkg.package_id)
        ? current.filter((id) => id !== pkg.package_id)
        : [...current, pkg.package_id],
    );
  };

  const handleConfirm = () => {
    const nextSelectedTests = [...selected];
    const nextSelectedPackages = packages.filter((pkg) =>
      selectedPackageIds.includes(pkg.package_id),
    );
    onConfirm(nextSelectedTests, nextSelectedPackages);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Select Tests & Packages
        <Button
          onClick={onClose}
          sx={{ minWidth: 0, position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="tests" label="Tests" />
          <Tab value="packages" label="Packages" />
        </Tabs>

        <TextField
          fullWidth
          size="small"
          placeholder={
            tab === "tests" ? "Search tests..." : "Search packages..."
          }
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {tab === "tests" ? (
          loading ? (
            <Typography>Loading tests...</Typography>
          ) : (
            <Stack spacing={1}>
              {filteredTests.map((test) => (
                <Box
                  key={test.test_id}
                  sx={{ border: "1px solid var(--color-border)", borderRadius: 2, p: 1 }}
                >
                  <Stack direction="row" alignItems="center">
                    <Checkbox
                      checked={selected.some(
                        (item) => item.test_id === test.test_id,
                      )}
                      onChange={() => toggleTest(test)}
                    />
                    <Box>
                      <Typography fontWeight={600}>{test.test_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {test.test_code || ""}{" "}
                        {test.category_name ? `• ${test.category_name}` : ""}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        textAlign: "right",
                        minWidth: 150,
                        ml: "auto",
                        pl: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Actual Price: ₹{test.price?.toFixed(2)}
                      </Typography>

                      {test.discount_price > 0 && (
                        <Typography variant="body2" color="success.main">
                          Discount Amount: ₹{test.discount_price?.toFixed(2)}
                        </Typography>
                      )}

                      <Typography fontWeight={700} color="primary">
                        Payable Amount: ₹{test.payable_amount?.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
              {!filteredTests.length && (
                <Typography color="text.secondary">No tests found.</Typography>
              )}
            </Stack>
          )
        ) : packagesLoading ? (
          <Typography>Loading packages...</Typography>
        ) : packagesError ? (
          <Typography color="error">{packagesError}</Typography>
        ) : (
          <Stack spacing={1}>
            {filteredPackages.map((pkg) => (
              <Box
                key={pkg.package_id}
                sx={{ border: "1px solid var(--color-border)", borderRadius: 2, p: 1 }}
              >
                <Stack direction="row" alignItems="center">
                  <Checkbox
                    checked={selectedPackageIds.includes(pkg.package_id)}
                    onChange={() => togglePackage(pkg)}
                  />
                  <Box>
                    <Typography fontWeight={600}>{pkg.package_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pkg.package_code || ""}{" "}
                      {pkg.total_tests ? `• ${pkg.total_tests} tests` : ""}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="primary"
                    sx={{ ml: "auto", pl: 2, whiteSpace: "nowrap" }}
                  >
                    ₹{pkg.package_price}
                  </Typography>
                </Stack>
              </Box>
            ))}
            {!filteredPackages.length && (
              <Typography color="text.secondary">No packages found.</Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={
            tab === "tests" ? !selected.length : !selectedPackageIds.length
          }
          onClick={handleConfirm}
        >
          Select {tab === "tests" ? selected.length : selectedPackageIds.length}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabWalkInTestSelectionPopup;
