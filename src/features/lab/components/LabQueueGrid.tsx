import { Box } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { LabQueueRow } from "./LabQueueTypes";

interface LabQueueGridProps {
  rows: LabQueueRow[];
  columns: GridColDef[];
  rowCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function LabQueueGrid({
  rows,
  columns,
  rowCount,
  currentPage,
  pageSize,
  onPageChange,
}: LabQueueGridProps) {
  return (
    <Box mt={2}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row: LabQueueRow) => row.lab_record_id}
        paginationMode="server"
        rowCount={rowCount}
        paginationModel={{ page: currentPage - 1, pageSize }}
        onPaginationModelChange={(model) => onPageChange(model.page + 1)}
        rowHeight={64}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          width: "100%",
          backgroundColor: "var(--color-surface-alt)",
          overflow: "hidden",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "transparent",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            fontSize: 12,
            letterSpacing: "0.06em",
            fontWeight: 600,
          },
          "& .MuiDataGrid-columnSeparator": { display: "none" },
          "& .MuiDataGrid-row": { fontSize: 13 },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(0,0,0,0.02)",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            "& .MuiDataGrid-row:nth-of-type(odd)": {
              backgroundColor: "rgba(15,23,42,0.02)",
            },
          },
          "& .MuiDataGrid-cell:focus": { outline: "none" },
          "& .MuiDataGrid-footerContainer": { borderTop: "none" },
        }}
      />
    </Box>
  );
}
