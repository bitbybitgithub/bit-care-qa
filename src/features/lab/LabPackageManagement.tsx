import React, { useMemo, useState } from "react";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Loader from "../../components/shared/Loader/Loader";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { getSessionItem } from "../../context/sessions/userSession";
import LabPackagePopUp from "./LabPackagePopUp";
import { toast } from "react-toastify";
import { deleteLabPackageApi, saveLabPackageApi } from "../../api";

interface LabPackageManagementProps {
  packages: any[];
  loading?: boolean;
  savedLabTests: any[];
  onRefresh: () => Promise<void>;
}

const LabPackageManagement: React.FC<LabPackageManagementProps> = ({
  packages,
  savedLabTests,
  loading,
  onRefresh,
}) => {
  const userId = getSessionItem("user", "user_id");
  const labId = getSessionItem("user", "lab_id");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | false>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [packagePopupOpen, setPackagePopupOpen] = useState(false);
  const isEditMode = Boolean(selectedPackage);
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const keyword = search.toLowerCase();

      return (
        pkg.package_name.toLowerCase().includes(keyword) ||
        pkg.package_code.toLowerCase().includes(keyword)
      );
    });
  }, [packages, search]);

  const handleAccordion =
    (packageId: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? packageId : false);
    };

  const handleDeletePackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setDeleteDialogOpen(true);
  };

  const handleEditPackage = (pkg: any) => {
    console.log("Editing package:", pkg);
    setSelectedPackage(pkg);
    setPackagePopupOpen(true);
  };

  const handleCreatePackage = () => {
    setSelectedPackage(null);
    setPackagePopupOpen(true);
  };

  const confirmDeletePackage = async () => {
    try {
      if (!selectedPackage) return;
      setDeleteLoading(true);
      const response = await deleteLabPackageApi(
        Number(selectedPackage.package_id),
        Number(userId),
      );
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success(response.message);
      setDeleteDialogOpen(false);
      setSelectedPackage(null);
      await onRefresh();
    } catch (error) {
      console.error("Delete package failed:", error);
      toast.error("Failed to delete package");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePackage = async (packageData: {
    packageName: string;
    packageCode: string;
    description: string;
    packagePrice: number;
    selectedTests: any[];
    actualPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }) => {
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      const payload = {
        package_id: selectedPackage ? Number(selectedPackage.package_id) : 0,
        lab_id: Number(labId),
        package_name: packageData.packageName,
        package_code: packageData.packageCode,
        description: packageData.description,
        actual_price: packageData.actualPrice,
        package_price: packageData.packagePrice,
        discount_amount: packageData.discountAmount,
        discount_percentage: packageData.discountPercentage,
        created_by: Number(userId),
        tests: packageData.selectedTests.map((test: any) => ({
          test_id: Number(test.test_id),
        })),
      };

      console.log(
        selectedPackage ? "Updating package:" : "Creating package:",
        payload,
      );
      // CREATE
      if (!selectedPackage) {
        const response = await saveLabPackageApi(payload);
        if (!response.success) {
          toast.error(response.message);
          return;
        }
        toast.success(response.message);
      }
      // UPDATE
      else {
        // We'll add updateLabPackageApi here
        // const response = await updateLabPackageApi(payload);
        // if (!response.success) {
        //   toast.error(response.message);
        //   return;
        // }
        // toast.success(response.message);
      }
      setPackagePopupOpen(false);
      setSelectedPackage(null);
      await onRefresh();
    } catch (error) {
      console.error("Save package failed:", error);
      toast.error("Failed to save package");
    }
  };
  if (loading) return <Loader message="Loading laboratory packages..." />;
  return (
    <Box sx={{ p: 2, backgroundColor: "#f9fafb" }}>
      {/* Header */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Laboratory Packages
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {packages.length} Packages •{" "}
            {packages.reduce((sum, p) => sum + Number(p.total_tests), 0)} Tests
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Search Package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            startIcon={<AddCircleOutlineIcon />}
            variant="contained"
            onClick={handleCreatePackage}
          >
            Create Package
          </Button>
        </Stack>
      </Stack>
      {/* Loading */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map((item) => (
            <Paper
              key={item}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #E5E7EB",
              }}
            >
              {/* Header */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box flex={1}>
                  <Skeleton variant="text" width={260} height={36} />
                  <Skeleton variant="text" width={180} height={24} />
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="rounded" width={80} height={28} />
                  <Skeleton variant="text" width={90} height={32} />
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="circular" width={36} height={36} />
                  <Skeleton variant="circular" width={36} height={36} />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : filteredPackages.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: "center",
            borderRadius: 3,
            border: "1px solid #E5E7EB",
          }}
        >
          <Typography variant="h6" gutterBottom>
            No Packages Found
          </Typography>

          <Typography color="text.secondary">
            Click <strong>Create Package</strong> to create your first package.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {filteredPackages.map((pkg) => (
            <Accordion
              key={pkg.package_id}
              expanded={expanded === pkg.package_id}
              onChange={handleAccordion(pkg.package_id)}
              sx={{
                mb: 2,
                overflow: "hidden",
                boxShadow: 2,
                "&:before": {
                  display: "none",
                },
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      color: "#6B7280",
                      fontSize: 24,
                      borderRadius: 2,
                    }}
                  />
                }
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                >
                  {/* LEFT */}

                  <Box flex={1}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography fontSize={28} fontWeight={700}>
                        {pkg.package_name}
                      </Typography>

                      <Chip
                        label={`${pkg.total_tests} Tests`}
                        color="primary"
                        size="small"
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {pkg.description || "No description available"}
                    </Typography>
                  </Box>

                  {/* Center Section */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      icon={<ScienceOutlinedIcon />}
                      label={`${pkg.total_tests} Tests`}
                      color="info"
                      size="small"
                    />
                  </Stack>

                  {/* Right Section */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <EditOutlinedIcon color="primary" fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackage(pkg);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteOutlineOutlinedIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  p: 0,
                  bgcolor: "#FCFCFD",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography fontWeight={700}>Test Name</Typography>
                      </TableCell>

                      <TableCell width={150}>
                        <Typography fontWeight={700}>Test Code</Typography>
                      </TableCell>

                      <TableCell width={180}>
                        <Typography fontWeight={700}>Category</Typography>
                      </TableCell>

                      <TableCell width={120} align="right">
                        <Typography fontWeight={700}>Price</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {pkg.tests.map((test: any, index: number) => (
                      <TableRow key={test.package_test_id} hover>
                        <TableCell>
                          <Typography fontWeight={600}>
                            {test.test_name}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={test.test_code}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: null }}
                          />
                        </TableCell>

                        <TableCell>{test.category_name}</TableCell>

                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            ₹{test.test_price}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Summary Cards */}
                <Box
                  sx={{
                    borderTop: "1px solid #e5e7eb",
                    bgcolor: "#fff",
                    p: 2,
                  }}
                >
                  <Stack direction="row" spacing={2} textAlign="center">
                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        border: "1px solid #ececec",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Actual Price
                      </Typography>

                      <Typography variant="h6" fontWeight={700}>
                        ₹{pkg.actual_price}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        flex: 1,
                        p: 2,
                        border: "1px solid #ececec",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Package Price
                      </Typography>

                      <Typography variant="h6" color="primary" fontWeight={700}>
                        ₹{pkg.package_price}
                      </Typography>
                    </Paper>
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      {/* Delete Package Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            pb: 1,
          }}
        >
          Delete Package
        </DialogTitle>

        <DialogContent>
          <Typography color="text.secondary" mb={3}>
            Are you sure you want to delete this package?
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{
                p: 2,
                borderBottom: "1px solid #ececec",
              }}
            >
              <Typography color="text.secondary">Package Name</Typography>

              <Typography fontWeight={600}>
                {selectedPackage?.package_name}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{
                p: 2,
                borderBottom: "1px solid #ececec",
              }}
            >
              <Typography color="text.secondary">Package Price</Typography>

              <Typography fontWeight={600}>
                ₹{selectedPackage?.package_price}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{
                p: 2,
              }}
            >
              <Typography color="text.secondary">Number of Tests</Typography>

              <Typography fontWeight={600}>
                {selectedPackage?.total_tests}
              </Typography>
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedPackage(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (!selectedPackage) return;
              handleDeletePackage(selectedPackage);
              setDeleteDialogOpen(false);
              setSelectedPackage(null);
            }}
          >
            Delete Package
          </Button>
        </DialogActions>
      </Dialog>

      <LabPackagePopUp
        open={packagePopupOpen}
        onClose={() => {
          setPackagePopupOpen(false);
          setSelectedPackage(null);
        }}
        savedLabTests={savedLabTests}
        selectedPackage={selectedPackage}
        loading={loading}
        onRefresh={onRefresh}
        onSavePackage={handleSavePackage}
      />
    </Box>
  );
};
export default LabPackageManagement;
