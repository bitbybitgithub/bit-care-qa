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
    <Box
      sx={{
        width: "100%",
        overflowX: "auto",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        backgroundColor: "var(--color-surface-alt)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row: LabQueueRow) => row.lab_record_id}
        paginationMode="server"
        rowCount={rowCount}
        paginationModel={{ page: currentPage - 1, pageSize }}
        onPaginationModelChange={(model) => onPageChange(model.page + 1)}
        rowHeight={60}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          width: "100%",
          minWidth: 720,
          border: "none",
          backgroundColor: "transparent",
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(2, 132, 199, 0.05)",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-primary)",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            fontWeight: 700,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
          },
          "& .MuiDataGrid-columnSeparator": { display: "none" },
          "& .MuiDataGrid-row": {
            fontSize: "0.8125rem",
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            transition: "background-color 0.15s ease",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(2, 132, 199, 0.04)",
          },
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
            outline: "none",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
            fontSize: "0.8125rem",
          },
        }}
      />
    </Box>
  );
}
