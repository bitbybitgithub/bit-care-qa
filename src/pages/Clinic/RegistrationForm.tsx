import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  InputAdornment,
  Autocomplete,
  FormControl,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { FaHospital, FaPhoneAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import Regex from "../../Helper/Regex";
import {
  getEntityTypes,
  getPincodeDetails,
  registerApi,
  type Entity,
} from "../../api";
import { validateRegistration } from "../../Helper/ErrorHandler";
import type {
  FormDataBase,
  LocationItem,
  ValidationErrors,
} from "../../types/types";
import OtpVerification from "../../components/common/OtpVerification";

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormDataBase>({
    entityType: 0,
    userId: 0,
    otp: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
    PINCode: "",
    area: "",
    district: "",
    state: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState({ mobile: false, email: false });

  const [districtList, setDistrictList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [areaList, setAreaList] = useState<string[]>([]);

  const [openPopup, setOpenPopup] = useState(false);
  const navigate = useNavigate();

  const clearError = (field: keyof FormDataBase) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ---- OTP POPUP ----
  const [mobileAnchor, setMobileAnchor] = useState<HTMLElement | null>(null);
  const [emailAnchor, setEmailAnchor] = useState<HTMLElement | null>(null);
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [entityList, setEntityList] = useState<Entity[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);

  useEffect(() => {
  const fetchEntities = async () => {
    setEntityLoading(true);
    try {
      const res = await getEntityTypes();
      if (res.success) {
        const formattedEntities = res.data
          .filter((e) => e.is_active === "1")
          .map((e) => ({
            ...e,
            entity_name:
              e.entity_name === "lab"
                ? "Diagnostic Lab"
                : e.entity_name.charAt(0).toUpperCase() +
                  e.entity_name.slice(1),
          }));

        setEntityList(formattedEntities);
      } else {
        toast.error(res.error || "Failed to load Center types");
      }
    } catch {
      toast.error("Unable to load Center types");
    } finally {
      setEntityLoading(false);
    }
  };

  fetchEntities();
}, []);

  /* ---------------- INPUT CHANGE HANDLERS ---------------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "name") {
      let error = "";
      if (!value.trim()) error = "Center name is required";
      else if (value.trim().length < 5)
        error = "Center name must be at least 5 characters long";
      else if (value.trim().length > 50)
        error = "Center name cannot exceed 50 characters";
      else if (!Regex.name.test(value.trim()))
        error = "Only alphabets and spaces are allowed";

      setErrors((prev) => ({ ...prev, name: error }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!Regex.address.test(value)) {
      setErrors((prev) => ({
        ...prev,
        address: "Address must be at least 10 characters",
      }));
    } else setErrors((prev) => ({ ...prev, address: "" }));

    setFormData((prev) => ({ ...prev, address: value }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length === 1 && /^[0-5]/.test(value)) return;
    if (value.length <= 10) setFormData((prev) => ({ ...prev, phone: value }));
  };

  const handleEmailBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const cleaned = e.target.value.trim().replace(/\s/g, "");
    setFormData((prev) => ({ ...prev, email: cleaned }));
    if (!cleaned)
      return setErrors((p) => ({ ...p, email: "Email is required" }));
    if (!Regex.email.test(cleaned))
      return setErrors((p) => ({
        ...p,
        email: "Please enter a valid email address",
      }));
  };

  /* ---------------- PINCODE API ---------------- */
  const fetchLocationList = (res: LocationItem[]) => {
    const states = new Set<string>();
    const districts = new Set<string>();
    const areas = new Set<string>();

    res.forEach((i) => {
      if (i?.State) states.add(i.State);
      if (i?.District) districts.add(i.District);
      if (i?.Name) areas.add(i.Name);
    });

    setStateList(Array.from(states));
    setDistrictList(Array.from(districts));
    setAreaList(Array.from(areas));
  };

  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length > 6) return;

    setFormData((p) => ({ ...p, PINCode: value }));

    // typing phase
    if (value.length < 6) {
      setErrors((p) => ({ ...p, PINCode: "Pincode must be 6 digits" }));
      setStateList([]);
      setDistrictList([]);
      setAreaList([]);
      setFormData((p) => ({ ...p, state: "", district: "", area: "" }));
      return;
    }

    if (!Regex.pincode.test(value)) {
      setErrors((p) => ({ ...p, PINCode: "Invalid pincode" }));
      return;
    }

    try {
      setErrors((p) => ({ ...p, PINCode: "" }));

      const result = await getPincodeDetails(value);

      if (!Array.isArray(result) || result.length === 0) {
        setErrors((p) => ({
          ...p,
          PINCode: "No records found for this pincode",
        }));
        return;
      }

      const first = result[0];

      setFormData((p) => ({
        ...p,
        state: first.State || "",
        district: first.District || "",
      }));

      setErrors((p) => ({
        ...p,
        state: "",
        district: "",
      }));

      fetchLocationList(result);
    } catch {
      setErrors((p) => ({ ...p, PINCode: "Failed to fetch pincode details" }));
    }
  };

  /* ---------------- SUBMIT REGISTRATION ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateRegistration(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length !== 0) return;

    setLoading(true);

    try {
      const res = await registerApi(formData);

      const normalized = {
        success: res?.success,
        message: res?.message,
        data: res?.data,
        error: res?.error,
        errors: res?.errors,
      };

      if (normalized.success) return setOpenPopup(true);

      const errMsg =
        normalized.message ||
        normalized.data?.message ||
        normalized.error ||
        (normalized.errors && Object.values(normalized.errors).join("\n")) ||
        "Something went wrong.";

      toast.error(errMsg);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    setOpenPopup(false);
    navigate("/login");
  };

  const FieldErrorText = ({ error }: { error?: string }) => (
    <FormHelperText
      error={!!error}
      sx={{ minHeight: "20px", visibility: error ? "visible" : "hidden" }}
    >
      {error}
    </FormHelperText>
  );

  return (
    <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl p-5">
      <div className="gap-2 p-2 text-center ">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-semibold)]"
          style={{ fontSize: "var(--font-h2)" }}
        >
          Create Account
        </h1>
        <h3 className="text-[var(--color-text)] ">
          Register your Center below
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-2 md:gap-5 my-4">
          <FormControl fullWidth>
            <Autocomplete
              options={entityList}
              loading={entityLoading}
              getOptionLabel={(option) => option.entity_name}
              value={
                entityList.find((e) => e.entity_id === formData.entityType) ||
                null
              }
              onChange={(_, v) => {
                setFormData((p) => ({
                  ...p,
                  entityType: v ? v.entity_id : 0,
                }));
                clearError("entityType");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Center Type"
                  size="small"
                  error={!!errors.entityType}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <FaHospital className="text-[var(--color-text)] ms-2" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {entityLoading && <CircularProgress size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <FieldErrorText error={errors.entityType} />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Center Name"
              name="name"
              size="small"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaHospital className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FieldErrorText error={errors.name} />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Mobile Number"
              size="small"
              value={formData.phone}
              disabled={verified.mobile}
              onChange={(e) => {
                handleNumberChange(e);
                if (e.target.value.length === 10) {
                  setMobileAnchor(e.target);
                  setShowMobileOtp(true);
                  clearError("phone");
                }
              }}
              error={!!errors.phone}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                  inputProps: { maxLength: 10 },
                },
              }}
            />
            <FieldErrorText error={errors.phone} />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Email Address"
              size="small"
              value={formData.email}
              disabled={verified.email}
              onBlur={(e) => {
                handleEmailBlur(e);
                if (Regex.email.test(e.target.value)) {
                  setEmailAnchor(e.target);
                  setShowEmailOtp(true);
                }
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\s/g, "");
                setFormData((prev) => ({ ...prev, email: cleaned }));
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={!!errors.email}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdEmail className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FieldErrorText error={errors.email} />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Pincode"
              name="PINCode"
              size="small"
              value={formData.PINCode}
              onChange={handlePincodeChange}
              error={!!errors.PINCode}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdLocationOn className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FieldErrorText error={errors.PINCode} />
          </FormControl>

          <FormControl>
            <Autocomplete
              readOnly
              open={false}
              disabled
              options={stateList}
              value={formData.state || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="State"
                  size="small"
                  error={!!errors.state}
                />
              )}
            />
            <FieldErrorText error={errors.state} />
          </FormControl>

          <FormControl>
            <Autocomplete
              readOnly
              open={false}
              disabled
              options={districtList}
              value={formData.district || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="District"
                  size="small"
                  error={!!errors.district}
                />
              )}
            />
            <FieldErrorText error={errors.district} />
          </FormControl>

          <FormControl fullWidth>
            <Autocomplete
              readOnly={areaList.length === 0}
              options={areaList}
              value={formData.area || null}
              // onChange={(_, v) => setFormData((p) => ({ ...p, area: v || "" },))}
              onChange={(_, v) => {
                setFormData((p) => ({ ...p, area: v || "" }));
                clearError("area");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Area"
                  size="small"
                  error={!!errors.area}
                />
              )}
            />
            <FieldErrorText error={errors.area} />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              placeholder="Address"
              name="address"
              size="small"
              value={formData.address}
              onChange={handleAddressChange}
              error={!!errors.address}
              multiline
              rows={3}
              slotProps={{
                input: {
                  inputProps: { maxLength: 70 },
                },
              }}
            />
            <FormHelperText
              error={!!errors.address}
              sx={{
                minHeight: "20px",
                visibility:
                  errors.address || formData.address ? "visible" : "hidden",
              }}
            >
              {errors.address
                ? errors.address
                : formData.address
                ? `${formData.address.length}/70 characters`
                : ""}
            </FormHelperText>
          </FormControl>
        </div>

        {/* SUBMIT */}
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          sx={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-bg)",
            "&:hover": { backgroundColor: "var(--color-primary)" },
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Register"
          )}
        </Button>

        <div className="text-center text-sm mt-2">
          Already have an account?
          <Link
            to="/login"
            className="text-[var(--color-primary)] hover:underline ml-1"
          >
            Click Here to login
          </Link>
        </div>
      </form>

      {/* SUCCESS POPUP */}
      <Dialog
        open={openPopup}
        onClose={handlePopupClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Welcome {formData.name}!</DialogTitle>
        <DialogContent>
          Your registration request has been submitted successfully. Login
          credentials have been sent to your email. If you have questions,
          contact (98989898989)
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={handlePopupClose}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              px: 4,
              borderRadius: "var(--radius-lg)",
              "&:hover": { backgroundColor: "var(--color-primary-dark)" },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP COMPONENTS */}
      <OtpVerification
        anchorEl={mobileAnchor}
        open={showMobileOtp && !verified.mobile}
        onClose={() => setShowMobileOtp(false)}
        contact={formData.phone}
        otpType={2} // mobile
        userId={formData.userId}
        onUserId={(id) => setFormData((p) => ({ ...p, userId: id }))}
        onVerified={() => setVerified((p) => ({ ...p, mobile: true }))}
      />

      <OtpVerification
        anchorEl={emailAnchor}
        open={showEmailOtp && !verified.email}
        onClose={() => setShowEmailOtp(false)}
        contact={formData.email}
        otpType={1} // email
        userId={formData.userId}
        onUserId={(id) => setFormData((p) => ({ ...p, userId: id }))}
        onVerified={() => setVerified((p) => ({ ...p, email: true }))}
      />
    </div>
  );
};

export default RegistrationForm;
