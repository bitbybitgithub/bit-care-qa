import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { FaTimes, FaSearch, FaFlask, FaBoxes } from "react-icons/fa";
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
    // Tests and packages are mutually exclusive
    setSelectedPackageIds([]);
    setSelected((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

  const togglePackage = (pkg: LabWalkInPackage) => {
    // Tests and packages are mutually exclusive
    setSelected([]);
    setSelectedPackageIds((current) =>
      current.includes(pkg.package_id)
        ? current.filter((id) => id !== pkg.package_id)
        : [pkg.package_id],
    );
  };

  const handleConfirm = () => {
    if (tab === "tests" && selected.length > 0) {
      onConfirm([...selected], []);
    } else if (tab === "packages" && selectedPackageIds.length > 0) {
      const nextSelectedPackages = packages.filter((pkg) =>
        selectedPackageIds.includes(pkg.package_id),
      );
      onConfirm([], nextSelectedPackages);
    } else if (selected.length > 0) {
      onConfirm([...selected], []);
    } else if (selectedPackageIds.length > 0) {
      const nextSelectedPackages = packages.filter((pkg) =>
        selectedPackageIds.includes(pkg.package_id),
      );
      onConfirm([], nextSelectedPackages);
    } else {
      onConfirm([], []);
    }
    onClose();
  };

  const currentSelectionCount =
    tab === "tests" ? selected.length : selectedPackageIds.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "var(--radius-xl)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-lg shrink-0">
            {tab === "tests" ? <FaFlask /> : <FaBoxes />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)]">
              Select Tests & Packages
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Select tests from catalog or choose a complete package
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      <DialogContent sx={{ p: { xs: 2, sm: 2.5 }, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
        {/* Navigation Tab Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center p-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] border border-[var(--color-border)]/30 w-fit">
            <button
              type="button"
              onClick={() => {
                setTab("tests");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] transition-all cursor-pointer ${
                tab === "tests"
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <FaFlask className="text-xs" />
              <span>Tests</span>
              {tests.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab === "tests"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  }`}
                >
                  {tests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("packages");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] transition-all cursor-pointer ${
                tab === "packages"
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-xs)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <FaBoxes className="text-xs" />
              <span>Packages</span>
              {packages.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab === "packages"
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  }`}
                >
                  {packages.length}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-2.5 text-[var(--color-primary)] text-xs pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                tab === "tests" ? "Search tests by name or code..." : "Search packages..."
              }
              className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm rounded-[var(--radius-lg)] border border-[var(--color-border)]/50 bg-[var(--color-surface-alt)] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all placeholder:text-[var(--color-text-secondary)]/60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-xs cursor-pointer"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {tab === "tests" ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <CircularProgress size={30} sx={{ color: "var(--color-primary)" }} />
                <p className="text-xs text-[var(--color-text-secondary)]">Loading tests catalog...</p>
              </div>
            ) : filteredTests.length > 0 ? (
              <div className="space-y-2">
                {filteredTests.map((test) => {
                  const isChecked = selected.some(
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
                      key={`test-${test.test_id}`}
                      onClick={() => toggleTest(test)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[var(--radius-lg)] border transition-all cursor-pointer ${
                        isChecked
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[var(--shadow-sm)]"
                          : "border-[var(--color-border)]/50 bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)]/60 hover:shadow-[var(--shadow-sm)]"
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
              <div className="text-center py-12 text-[var(--color-text-secondary)] text-sm">
                No tests found matching your search.
              </div>
            )
          ) : packagesLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <CircularProgress size={30} sx={{ color: "var(--color-primary)" }} />
              <p className="text-xs text-[var(--color-text-secondary)]">Loading packages...</p>
            </div>
          ) : packagesError ? (
            <div className="text-center py-12 text-[var(--color-error)] text-sm">
              {packagesError}
            </div>
          ) : filteredPackages.length > 0 ? (
            <div className="space-y-2">
              {filteredPackages.map((pkg) => {
                const isChecked = selectedPackageIds.includes(pkg.package_id);
                const actual = Number(pkg.actual_price ?? 0);
                const discount = Number(pkg.discount_amount ?? 0);
                const packagePrice = Number(pkg.package_price ?? 0);

                return (
                  <div
                    key={`pkg-${pkg.package_id}`}
                    onClick={() => togglePackage(pkg)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[var(--radius-lg)] border transition-all cursor-pointer ${
                      isChecked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-[var(--shadow-sm)]"
                        : "border-[var(--color-border)]/50 bg-[var(--color-surface-alt)] shadow-[var(--shadow-xs)] hover:border-[var(--color-primary)]/60 hover:shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => togglePackage(pkg)}
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
                          {pkg.package_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {pkg.package_code && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              Code: {pkg.package_code}
                            </span>
                          )}
                          {pkg.total_tests ? (
                            <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                              {pkg.total_tests} Tests Included
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/30 text-right pl-7 sm:pl-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {actual > packagePrice && (
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            Actual Price: <span className="line-through">₹{actual.toFixed(2)}</span>
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="text-xs text-[var(--color-success)] font-medium">
                            Discount: -₹{discount.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[var(--color-primary)] sm:mt-0.5">
                        Package Price: ₹{packagePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--color-text-secondary)] text-sm">
              No packages found matching your search.
            </div>
          )}
        </div>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(var(--color-border), 0.2)", display: "flex", justifyContent: "space-between" }}>
        <div className="text-xs text-[var(--color-text-secondary)]">
          {currentSelectionCount > 0 ? (
            <span>
              <strong className="text-[var(--color-primary)]">{currentSelectionCount}</strong> {tab === "tests" ? "test" : "package"}{currentSelectionCount > 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No {tab === "tests" ? "tests" : "packages"} selected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              borderRadius: "var(--radius-lg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              "&:hover": {
                borderColor: "var(--color-text)",
                backgroundColor: "var(--color-bg)",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            variant="contained"
            size="small"
            disabled={currentSelectionCount === 0}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              boxShadow: "var(--shadow-xs)",
              "&:hover": {
                backgroundColor: "var(--color-primary)",
                opacity: 0.9,
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                opacity: 0.6,
              },
            }}
          >
            Select {currentSelectionCount > 0 ? `(${currentSelectionCount})` : ""}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default LabWalkInTestSelectionPopup;
