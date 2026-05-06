import React from "react";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { getSessionItem } from "../../../../context/sessions/userSession";
import { approveClinicApi } from "../../api/SupportApi";
import { toast } from "react-toastify";

type UserRow = {
  enquiry_id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state_name: string;
  created_date?: any;
  is_approved: string;
};

interface Props {
  data: UserRow[];
  setData: React.Dispatch<React.SetStateAction<UserRow[]>>;
  isPendingTab: boolean;
}

const SupportClinicList: React.FC<Props> = ({
  data,
  setData,
  isPendingTab,
}) => {
  const handleApprove = async (id: number) => {
    try {
      const userId = getSessionItem("user", "user_id");

      await approveClinicApi(id, userId);

      setData((prev) =>
        prev.map((item) =>
          item.enquiry_id === id ? { ...item, is_approved: "1" } : item,
        ),
      );

      toast.success("Clinic approved successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to approve clinic");
    }
  };

  const baseColumns: GridColDef<UserRow>[] = [
    { field: "enquiry_id", headerName: "ID", flex: 0.2 },
    { field: "name", headerName: "Clinic Name", flex: 1.3 },
    { field: "phone", headerName: "Phone", flex: 0.7 },
    { field: "email", headerName: "Email", flex: 1.5 },
    { field: "address", headerName: "Address", flex: 1.8 },
    { field: "pincode", headerName: "Pincode", flex: 1 },
    { field: "city", headerName: "City", flex: 1 },
    { field: "district", headerName: "District", flex: 1 },
    { field: "state_name", headerName: "State", flex: 1 },

    {
      field: "created_date",
      headerName: "Date",
      flex: 0.8,
      valueFormatter: (value) => {
        if (!value) return "";
        const d = new Date(value as string);
        if (isNaN(d.getTime())) return "";

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
      },
    },
  ];
  const columns = isPendingTab
    ? [
        ...baseColumns,
        {
          field: "action",
          headerName: "Action",
          flex: 1,
          sortable: false,
          renderCell: (params: GridRenderCellParams<UserRow>) => (
            <button
              onClick={() => handleApprove(params.row.enquiry_id)}
              className="
        px-3 py-1 text-xs font-semibold
        rounded-[var(--radius-md)]
        bg-[var(--color-primary)]
        text-white
        hover:opacity-90
        transition
      "
            >
              Approve
            </button>
          ),
        },
      ]
    : baseColumns;

  return (
    <DataGrid<UserRow>
      rows={data}
      columns={columns}
      getRowId={(row) => row.enquiry_id}
      autoHeight
      density="compact"
      disableRowSelectionOnClick
      initialState={{
        pagination: {
          paginationModel: { pageSize: 10, page: 0 },
        },
      }}
      pageSizeOptions={[5, 10, 20]}
      sx={{
        minWidth: 1100,
        backgroundColor: "var(--color-surface-alt)",
        overflow: "hidden",

        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "transparent",
          color: "var(--color-primary)",
          textTransform: "uppercase",
          fontSize: 12,
          letterSpacing: "0.06em",
        },

        "& .MuiDataGrid-row": {
          fontSize: 13,
        },

        "& .MuiDataGrid-row:hover": {
          backgroundColor: "rgba(0,0,0,0.02)",
        },

        "& .MuiDataGrid-cell": {
          alignItems: "center",
          display: "flex",
        },

        "& .MuiDataGrid-virtualScrollerRenderZone": {
          "& .MuiDataGrid-row:nth-of-type(odd)": {
            backgroundColor: "rgba(15,23,42,0.02)",
          },
        },
      }}
    />
  );
};

export default SupportClinicList;
