
import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Checkbox,
  Button,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  FormControlLabel,
  styled,
  Switch,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { toast } from "react-toastify";
import { getlabtestserviceApi, saveAvailableLabApi } from "../../api/labApis/LabApi";
import type {
  LabTest,
  LabCategory,
  SelectedTest,
  LabTestApiResponse,
  LabTestItemRequest
} from "../../types/labType/LabTestInterfaces";
import { getSessionItem } from "../../context/sessions/userSession";
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
const ServiceManagement: React.FC = () => {
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [search, setSearch] = useState<string>("");
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [labTests, setLabTests] = useState<LabCategory[]>([]);
  const [isOn, setIsOn] = useState(false);
  const labId = getSessionItem("user", "lab_id");

  const transformLabTests = (data: Record<string, LabTestApiResponse[]>): LabCategory[] => {
    return Object.entries(data).map(([categoryName, tests]) => ({
      category: categoryName,
      tests: tests
        .filter(t => t.is_active === "1")
        .map(test => ({
          id: String(test.test_id), // IMPORTANT: id as string
          name: test.test_name,
        })),
    }));
  };
  useEffect(() => {
    const fetchlist = async () => {
      try {
        const res: any = await getlabtestserviceApi(labId);
        const formattedData = transformLabTests(res);
        setLabTests(formattedData);

      }
      catch {
        console.log(Error)
      }
    }
    fetchlist();
  }, [])





  const savelist = async () => {
    try {
      if (!labId) {
        console.error("Lab ID not found");
        return;
      }

      const testIds: number[] = selectedTests
        .map(test => Number(test.testId))
        .filter(id => !isNaN(id));

      if (testIds.length === 0) {
        console.error("No valid test IDs");
        return;
      } else if (labId == testIds) {
        console.error("LabId and TestId not same")
        return;
      }
      const payload: LabTestItemRequest = {
        lab_id: Number(labId),
        test_id: testIds,
        created_by: "Admin",
      };
      console.log("FINAL PAYLOAD:", payload);
      const res = await saveAvailableLabApi(payload);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.success(res.message);
      }
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };




  React.useEffect(() => {
    if (!search) return;
    const searchLower = search.toLowerCase();
    const matchedCategory = labTests.find((group) =>
      group.tests.some((test) =>
        test.name.toLowerCase().includes(searchLower)
      )
    );
    if (matchedCategory) {
      setExpandedAccordion(matchedCategory.category);
    }
  }, [search]);

  const selectedSet = useMemo(
    () => new Set(selectedTests.map(t => t.testId)),
    [selectedTests]
  );

  const isChecked = (id: string) => selectedSet.has(id);

  const handleToggle = (
    category: string,
    test: LabTest,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedTests((prev) => [
        ...prev,
        { category, testId: test.id, testName: test.name },
      ]);
    } else {
      setSelectedTests((prev) =>
        prev.filter((t) => t.testId !== test.id)
      );
    }
  };

  const groupedTests = selectedTests.reduce<Record<string, string[]>>(
    (acc, test) => {
      acc[test.category] = acc[test.category] || [];
      acc[test.category].push(test.testName);
      return acc;
    },
    {}
  );

 
  const getCategoryTestIds = (category: LabCategory) =>
    category.tests.map(t => t.id);

 
  const isCategoryChecked = (category: LabCategory) =>
    getCategoryTestIds(category).every(id => selectedSet.has(id));


  const isCategoryIndeterminate = (category: LabCategory) => {
    const ids = getCategoryTestIds(category);
    const selectedCount = ids.filter(id => selectedSet.has(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  };

  const handleSelectAll = (category: LabCategory, checked: boolean) => {
    if (checked) {
      setSelectedTests(prev => {
        const existingIds = new Set(prev.map(p => p.testId));

        const newOnes = category.tests
          .filter(t => !existingIds.has(t.id))
          .map(t => ({
            category: category.category,
            testId: t.id,
            testName: t.name,
          }));

        return [...prev, ...newOnes];
      });
    } else {
      // REMOVE all tests in this category
      setSelectedTests(prev =>
        prev.filter(t => t.category !== category.category)
      );
    }
  };

  console.log(groupedTests)


  const StyledSwitch = styled(Switch)(({ theme }) => ({
    width: 52,
    height: 28,
    padding: 0,
    display: "flex",
    "& .MuiSwitch-switchBase": {
      padding: 2,
      "&.Mui-checked": {
        transform: "translateX(24px)",
        color: "#fff",
        "& + .MuiSwitch-track": {
          backgroundColor: theme.palette.primary.main,
          opacity: 1,
        },
      },
    },
    "& .MuiSwitch-thumb": {
      width: 24,
      height: 24,
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    },
    "& .MuiSwitch-track": {
      borderRadius: 28 / 2,
      backgroundColor: "#ccc",
      opacity: 1,
    },
  }));

  

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsOn(event.target.checked); // true = ON, false = OFF
  };
  return (
    <div className="h-auto md:mt-1 px-5 py-2 bg-[var(--color-white)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)]  transition-all">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-3  p-2 bg-[var(--color-white)]">
          <div className="flex flex-col md:ml-3 md:flex-row md:items-center md:justify-between gap-4">

            <FormControlLabel
              control={
                <StyledSwitch
                  checked={isOn}
                  onChange={handleChange}
                />
              }
              label="Doorstepes services for 24 hrs"
              sx={{
                gap: 2,
                color: "var(--color-primary-dark)",
                "& .MuiFormControlLabel-label": {
                  fontSize: "1.5rem", 
                  fontWeight: 600,
                },
              }}
            />


            <TextField
              size="small"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </div>


        </div>

        {/* ACCORDIONS */}
        {labTests.map((group, index) => {
          const searchLower = search.toLowerCase();
          const filteredTests = group.tests.filter(
            (test) =>
              test.name.toLowerCase().includes(searchLower) ||
              group.category.toLowerCase().includes(searchLower)
          );

          if (
            !group.category.toLowerCase().includes(searchLower) &&
            filteredTests.length === 0
          ) {
            return null;
          }

          const testsToShow = group.category
            .toLowerCase()
            .includes(searchLower)
            ? group.tests
            : filteredTests;

          const count = selectedTests.filter(
            (t) => t.category === group.category
          ).length;

          return (

            <Accordion
              key={group.category}
              expanded={expandedAccordion === group.category}
              onChange={(_, isExpanded) =>
                setExpandedAccordion(isExpanded ? group.category : false)
              }
              sx={{
                backgroundColor: count !== 0 ? "var(--color-surface-alt)" : "var(--color-lg)",
                borderRadius: "var(--radius-lg)",
              }}
              disableGutters
              className="mb-2  border rounded-[var(--radius-lg)]  border-[var(--color-primary)] hover:shadow-md transition before:hidden"
            >

              <AccordionSummary
                className="rounded-[var(--radius-lg)] from-white to-blue-50 hover:from-blue-50 hover:to-blue-100"
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* LEFT SIDE */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-[var(--color-primary-dark)]">
                    <ArrowDropDownRoundedIcon sx={{ fontSize: 32 }} />
                  </div>

                  <div className="font-semibold text-[var(--color-text)]">
                    {group.category}
                  </div>

                  {count > 0 && (
                    <Chip size="small" label={count} color="primary" />
                  )}
                </div>

                {/* RIGHT SIDE – SELECT ALL */}
                <div className="flex items-center gap-1">
                  <Checkbox
                    checked={isCategoryChecked(group)}
                    indeterminate={isCategoryIndeterminate(group)}
                    onChange={(e) => handleSelectAll(group, e.target.checked)}
                    sx={{
                      "&.Mui-checked": {
                        color: "#2563eb",
                      },
                    }}
                  />
                  <span className="text-[var(--color-text)] font-medium">Select All</span>
                </div>
              </AccordionSummary>


              <Divider />

              <AccordionDetails>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {testsToShow.map((test) => (
                    <label
                      key={test.id}
                      className={`flex items-center gap-0 p-0 rounded-[var(--radius-lg)] cursor-pointer border transition-all ${isChecked(test.id)
                        ? "border-blue-500  shadow-sm bg-pink-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-[var(--color-surface-alt)] hover:shadow-sm"
                        }`}
                    >
                      <Checkbox
                        checked={isChecked(test.id)}
                        sx={{
                          "&.Mui-checked": {
                            color: "#2563eb",
                          },
                        }}
                        onChange={(e) =>
                          handleToggle(
                            group.category,
                            test,
                            e.target.checked
                          )
                        }
                      />
                      <span className="font-semibold text-[var(--color-text)] ">
                        {test.name}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {/* FOOTER */}
        <div className="mt-2  bg-[var(--color-white)]  rounded-[var(--radius-lg)]  transition-all p-2 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Typography className="text-slate-600">
            {selectedTests.length === 0
              ? "No tests selected"
              : <Chip
                icon={<CheckCircleIcon />}
                label={`${selectedTests.length} Tests Selected`}
                color="primary"
                className="mt-0 ml-1 "
              />}
          </Typography>

          <div className="flex gap-3">
            <Button
              variant="outlined"
              className="!rounded-xl"
              onClick={() => setSelectedTests([])}
              disabled={selectedTests.length === 0}
            >
              Clear All
            </Button>

            <Button
              variant="contained"
              color="primary"


              className="rounded-[var(--radius-lg)] py-3 text-[var(--font-body)] font-semibold shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transition-all"
              onClick={() => {
                setOpenDialog(true)
                setExpandedAccordion(false)
              }}
              disabled={selectedTests.length === 0}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>


      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 ">
          <Typography sx={{ color: "var(--color-primary)" }} variant="h6" fontWeight={600}>
            Selected Laboratory Tests
          </Typography>

          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ fontSize: "24px" }}
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <DialogContent sx={{ px: 4, py: 3 }}>
          {Object.entries(groupedTests).map(([category, tests]) => (
            <div key={category} className="mb-4">
              {/* Category */}
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "var(--color-primary)",
                }}
              >
                {category}
              </Typography>

              {/* Test List */}
              <div className="border border-[var(--color-border)] rounded-md overflow-hidden">
                {tests.map((test, index) => (
                  <div
                    key={test}
                    className={`px-3 py-2 text-sm font-semibold
                ${index % 2 === 0 ? "bg-gray-300" : "bg-[var(--color-bg]"}`}
                  >
                    {test}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </DialogContent>

        {/* Actions */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #eee" }}>
          {/* <Button onClick={() => setOpenDialog(false)}>
      Cancel
    </Button> */}

          <Button
            variant="contained"
            onClick={() => {
              console.log(selectedTests);
              savelist();
              setSearch("");

              setOpenDialog(false);
              setSelectedTests([]);
              setExpandedAccordion(false);
            }}
          >
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>




    </div>

  );
};

export default ServiceManagement;


