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
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { getLabTestListApi } from "../../../api/labApis/LabApi";

export interface LabWalkInTest {
  test_id: number;
  category_id: number;
  test_name: string;
  test_code?: string;
  price: number;
  category_name?: string;
}

interface Props {
  open: boolean;
  labId: number;
  onClose: () => void;
  selectedTests: LabWalkInTest[];
  onConfirm: (tests: LabWalkInTest[]) => void;
}

const LabWalkInTestSelectionPopup: React.FC<Props> = ({
  open,
  labId,
  onClose,
  selectedTests,
  onConfirm,
}) => {
  const [tests, setTests] = useState<LabWalkInTest[]>([]);
  const [selected, setSelected] = useState<LabWalkInTest[]>(selectedTests);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(selectedTests);
    setSearch("");
    const loadTests = async () => {
      setLoading(true);
      try {
        const response = await getLabTestListApi(labId);
        const data = Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
        setTests(
          data.map((test: any) => ({
            test_id: Number(test.test_id),
            category_id: Number(test.category_id),
            test_name: test.test_name,
            test_code: test.test_code,
            price: Number(test.price ?? test.test_price ?? 0),
            category_name: test.category_name,
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    void loadTests();
  }, [open, labId, selectedTests]);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tests;
    return tests.filter(
      (test) =>
        test.test_name.toLowerCase().includes(keyword) ||
        test.test_code?.toLowerCase().includes(keyword),
    );
  }, [search, tests]);

  const toggleTest = (test: LabWalkInTest) => {
    setSelected((current) =>
      current.some((item) => item.test_id === test.test_id)
        ? current.filter((item) => item.test_id !== test.test_id)
        : [...current, test],
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Select Tests
        <Button
          onClick={onClose}
          sx={{ minWidth: 0, position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Search tests..."
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
        {loading ? (
          <Typography>Loading tests...</Typography>
        ) : (
          <Stack spacing={1}>
            {filteredTests.map((test) => (
              <Box
                key={test.test_id}
                sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 1 }}
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
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="primary"
                    sx={{ ml: "auto", pl: 2, whiteSpace: "nowrap" }}
                  >
                    ₹{test.price}
                  </Typography>
                </Stack>
              </Box>
            ))}
            {!filteredTests.length && (
              <Typography color="text.secondary">No tests found.</Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selected.length}
          onClick={() => {
            onConfirm(selected);
            onClose();
          }}
        >
          Select {selected.length ? `(${selected.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabWalkInTestSelectionPopup;
