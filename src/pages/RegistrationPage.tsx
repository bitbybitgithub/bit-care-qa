import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Autocomplete,
} from "@mui/material";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { validateRegistration } from "../Helper/ErrorHandler";
import type {
  FormDataBase,
  PostOffice,
  ValidationErrors,
} from "../types/types";
import type { SelectChangeEvent } from "@mui/material";
import { regex } from "../context/Regex";
import { getPincodeDetails } from "../api/ServiceApi";

interface SubmitFormData extends Omit<FormDataBase, "gender"> {}

const Registration = () => {
  const [formData, setFormData] = useState<SubmitFormData>({
    name: "",
    email: "",
    phone: "",
    type: "",
    address: "",
    strNumber: "",
    PINCode: "",
    city: "",
    district: "",
    state: "",
    password: "",
    confirmPassword: "",
  });

  const [cityList, setCityList] = useState([]);
  const [districList, setDistricList] = useState([]);
  const [stateList, setStateList] = useState([]);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [selectedOffice, setSelectedOffice] = useState("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

const fetchLocationList = (responseData: []) => {
  const blockList: [] = [];
  const stateList: [] = [];
  const districtList: [] = [];

  responseData.forEach(item => {
    if (item?.Block) blockList.push(item.Block);
    if (item?.Circle) stateList.push(item.Circle);
    if (item?.District) districtList.push(item.District);
  });

  setCityList(blockList);
  setStateList(stateList);
  setDistricList(districtList);
};


  console.log({cityList})
  console.log({stateList})
  console.log({districList})
  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email" && value && !regex.email.test(value)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
    }

    if (name === "PINCode") {
      if (value.length < 6) {
        setErrors((prev) => ({ ...prev, PINCode: "Pincode must be 6 digits" }));
      } else if (!regex.pincode.test(value)) {
        setErrors((prev) => ({ ...prev, PINCode: "Invalid pincode" }));
      } else if (value.length === 6) {
        try {
          const result = await getPincodeDetails(value);
          console.log("Pincode API Response:", result);
          fetchLocationList(result)
          // if (result && result[0]?.Status === "Success") {
          //   const offices = result[0]?.PostOffice || [];
          //   setPostOffices(offices);
          //   if (offices.length > 0) {
          //     handlePostOfficeSelect(offices[0].Name, offices[0]);
          //   }
          // } else if (result && result[0]?.Status === "Error") {
          //   setErrors((prev) => ({
          //     ...prev,
          //     PINCode: "Invalid or not found",
          //   }));
          // }
        } catch {
          setErrors((prev) => ({
            ...prev,
            PINCode: "Failed to fetch pincode",
          }));
        }
      }
    }
  };

  const handlePostOfficeSelect = (
    officeName: string,
    officeData?: PostOffice
  ) => {
    setSelectedOffice(officeName);

    const selected =
      officeData || postOffices.find((o) => o.Name === officeName);

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        city: selected.Block || "",
        district: selected.District || "",
        state: selected.State || "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRegistration(formData as FormDataBase);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        console.log("Form valid. Submit to API:", formData);
      } catch (err) {
        setErrors({ general: "Registration failed" });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Box
        component={Paper}
        elevation={6}
        square
        sx={{
          flex: 1,
          backgroundColor: "#2f3640",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              REGISTER YOUR CLINIC
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              className="bg-white border-2 rounded"
              placeholder="Name"
              margin="normal"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              //       InputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              fullWidth
              className="bg-white border-2 rounded"
              margin="normal"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
              error={!!errors.phone}
              helperText={errors.phone}
              //       InputProps={{ style: { color: "#fff" } }}
            />
            <TextField
              fullWidth
              className="bg-white border-2 rounded"
              placeholder="Email Address"
              margin="normal"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              //       slotProps={{ input: { style: { color: "#fff" } } }}
            />
            <TextField
              className="bg-white border-2 rounded"
              fullWidth
              placeholder="Pincode"
              margin="normal"
              name="PINCode"
              onChange={handlePincodeChange}
              value={formData.PINCode}
              error={!!errors.PINCode}
              helperText={errors.PINCode}
              //       slotProps={{ input: { style: { color: "#fff" } } }}
            />

            <Autocomplete
              disabled={cityList.length == 0 ? true : false}
              options={cityList} // array of strings or objects
              value={formData.city || null}
              onChange={
                (e, newValue) => console.log(newValue)
                // handleInputChange({ target: { name: "city", value: newValue } })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="bg-white border-2 rounded"
                  fullWidth
                  placeholder="City"
                  margin="normal"
                  name="city"
                  error={!!errors.city}
                  helperText={errors.city}
                />
              )}
            />

            <Autocomplete
              disabled={districList.length == 0  ? true : false}
              options={districList}
              value={formData.district || null}
              onChange={
                (e, newValue) => console.log(newValue)
                // handleInputChange({
                //   target: { name: "district", value: newValue },
                // })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="bg-white border-2 rounded"
                  fullWidth
                  placeholder="District"
                  margin="normal"
                  name="district"
                  error={!!errors.district}
                  helperText={errors.district}
                />
              )}
            />

            <Autocomplete
              disabled={stateList.length == 0  ? true : false}
              options={stateList}
              value={formData.state || null}
              onChange={
                (e, newValue) => console.log(newValue)
                // handleInputChange({
                //   target: { name: "state", value: newValue },
                // })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="bg-white border-2 rounded"
                  fullWidth
                  placeholder="State"
                  margin="normal"
                  name="state"
                  error={!!errors.state}
                  helperText={errors.state}
                />
              )}
            />

            <TextField
              className="bg-white border-2 rounded"
              fullWidth
              margin="normal"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#fff" }}>
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              className="bg-white border-2 rounded"
              fullWidth
              margin="normal"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      sx={{ color: "#fff" }}>
                      {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth margin="normal" error={!!errors.type}>
              <InputLabel sx={{ color: "#ccc" }}></InputLabel>
              <Select
                className="bg-white border-2 rounded"
                name="type"
                value={formData.type}
                onChange={handleSelectChange}>
                <MenuItem value="">Select...</MenuItem>
                <MenuItem value="clinic">Clinic</MenuItem>
                <MenuItem value="paid">Single Doctor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error">
                  {errors.type}
                </Typography>
              )}
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: "#1dd1a1",
                "&:hover": { bgcolor: "#10ac84" },
              }}>
              {loading ? "Registering..." : "Create Account"}
            </Button>

            {errors.general && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {errors.general}
              </Typography>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Registration;
