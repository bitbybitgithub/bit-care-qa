import React, { useEffect, useState } from "react";
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TablePagination,
  Tooltip,
} from "@mui/material";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
  data;
  setData;
}
const NewUsers: React.FC<Props> = ({ data, setData }) => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleApprove = (id: number) => {
    // setData((prev) =>
    //   prev.map((item) =>
    //     item.id === id ? { ...item, status: "approved" } : item
    //   )
    // );
  };

  const handleReject = (id: number) => {
    // setData((prev) =>
    //   prev.map((item) =>
    //     item.id === id ? { ...item, status: "rejected" } : item
    //   )
    // );
  };

  // Filter
  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search)
  );

  const handleChangePage = (
    event: unknown,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        Support Dashboard
      </h1>

      {/* Search */}
      <div className="mb-4 w-full flex justify-start">
        <div className="w-full md:w-1/4">
          <TextField
            label="Search by Name or Phone"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <TableContainer
        component={Paper}
        className="shadow-lg rounded-2xl overflow-x-auto"
      >
        <Table size="small" className="min-w-[1320px]">
          <TableHead>
            <TableRow className="bg-blue-200">
              {[
                "ID",
                "Name",
                "Phone",
                "Email",
                "Address",
                "Pincode",
                "City",
                "District",
                "State",
                "Date",
                "Status",
                "Action",
              ].map((head) => (
                <TableCell
                  key={head}
                  className="!text-blue-900 font-semibold !py-2 !px-3"
                >
                  {head}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.
              slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).
              map((row) => (
                <TableRow key={row.id} className="hover:bg-blue-100">
                  <TableCell className="!py-1 !px-3">{row.enquiry_id}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.name}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.phone}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.email}</TableCell>
                  <TableCell className="!py-1 !px-3 max-w-[150px] truncate">
                    <Tooltip title={row.address} arrow>
                      <span className="block truncate cursor-pointer">
                        {row.address}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="!py-1 !px-3">{row.pincode}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.city}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.district}</TableCell>
                  <TableCell className="!py-1 !px-3">{row.state_name}</TableCell>
                  <TableCell className="!py-1 !px-3">
                    {new Date(row.created_date).toISOString().split("T")[0]}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="!py-1 !px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${row.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : row.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="!py-1 !px-3">
                    <div className="flex gap-2">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={row.status !== "pending"}
                        onClick={() => handleApprove(row.id)}
                      >
                        Approve
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        disabled={row.status !== "pending"}
                        onClick={() => handleReject(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 15]}
      />
      {/* Toast */}
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default NewUsers;