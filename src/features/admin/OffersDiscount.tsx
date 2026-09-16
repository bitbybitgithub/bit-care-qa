import React, { useState } from "react";
import bitcarelogo from "../../assets/BitCareLogo.png";
import { TextField, Button } from "@mui/material";
import type { OfferForm, ValidationErrors } from "../../types/types";
import { offersdiscountApi, uploadOfferImageApi } from "../../api";
import { toast } from "react-toastify";
import { getSession } from "../../context/sessions/userSession";

const OffersDiscount = () => {
  const today = new Date().toISOString().split("T")[0];
  const [errors, setErrors] = useState<ValidationErrors<OfferForm>>({
    offer_title: "",
    offer_description: "",
    offer_image: "",
    discount_percentage: "",
    coupon_code: "",
    start_date: "",
    end_date: "",
    priority: "",
  });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OfferForm>({
    offer_title: "",
    offer_description: "",
    offer_image: null,
    offer_image_path: "",
    offer_image_guid: "",
    offer_image_name: "",
    discount_percentage: "",
    coupon_code: "",
    start_date: "",
    end_date: "",
    priority: 0,
    created_by: getSession("user").user_id ?? 0,
  });

  const [preview, setPreview] = useState("");
  const user = getSession("user");
  const handleChange = (e) => {
    const { name, value, files, checked, type } = e.target;

    if (files && files.length > 0) {
      const file = files[0];

      setFormData((prev) => ({
        ...prev,
        offer_image: file,
      }));

      setPreview(URL.createObjectURL(file));
      setErrors((prev) => ({
        ...prev,
        offer_image: "",
      }));
      return;
    }

    if (name === "discount_percentage") {
      const regex = /^\d{0,2}(\.\d{0,2})?$/;
      const discount = Number(value);

      if (value !== "" && (!regex.test(value) || discount >= 100)) {
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {
      offer_title: "",
      offer_description: "",
      offer_image: "",
      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: "",
    };

    if (!formData.offer_title.trim())
      newErrors.offer_title = "Offer Title is required.";

    if (!formData.offer_description.trim())
      newErrors.offer_description = "Offer Description is required.";

    if (!formData.offer_image)
      newErrors.offer_image = "Please upload an image.";

    const discount = Number(formData.discount_percentage);

    if (
      formData.discount_percentage === "" ||
      discount <= 0 ||
      discount >= 100
    ) {
      newErrors.discount_percentage =
        "Discount must be greater than 0 and less than 100.";
    }

    if (!formData.coupon_code.trim())
      newErrors.coupon_code = "Coupon Code is required.";

    if (!formData.start_date) newErrors.start_date = "Start Date is required.";

    if (!formData.end_date) newErrors.end_date = "End Date is required.";

    setErrors(newErrors);

    return Object.values(newErrors).every((x) => x === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validateForm()) {
      return;
    }

    const centerId =
      user.entity_type === 1
        ? user.clinic_id
        : user.entity_type === 2
          ? user.lab_id
          : undefined;

    if (!centerId) {
      toast.error("A valid clinic or lab session is required.");
      return;
    }

    setLoading(true);

    try {
      const uploadResponse = await uploadOfferImageApi(formData.offer_image);
      const uploadedFile = uploadResponse?.files?.[0];

      if (!uploadedFile) {
        throw new Error("Offer image upload returned no file.");
      }

      const offerData = {
        ...formData,
        center_id: centerId,
        entity_type: user.entity_type,
        center_name: user.full_name,
        center_type: user.entity_name,
        created_by: user.user_id ?? 0,
        offer_image_path: `${uploadedFile.path}\\${uploadedFile.guid_name}`,
        offer_image_guid: uploadedFile.guid_name,
        offer_image_name: uploadedFile.file_name,
      };
      const res = await offersdiscountApi(offerData);
      toast.success(res.message);
      handleReset();
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

  const handleReset = () => {
    setFormData({
      offer_title: "",
      offer_description: "",
      offer_image: null,
      offer_image_path: "",
      offer_image_guid: "",
      offer_image_name: "",
      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: 0,
      created_by: user.user_id ?? 0,
    });

    setPreview("");
    setErrors({} as ValidationErrors);
  };

  return (
    <div className="mx-auto w-full p-2 bg-white shadow-lg border border-gray-400 rounded-xl">
      <h2 className="relative flex items-center justify-center h-20  text-black text-2xl font-bold border border-gray-400 rounded-2xl mb-4">
        {/* Logo */}
        <img
          src={bitcarelogo}
          alt="BitCare Logo"
          className="absolute left-1.5 w-35 h-18 bg-white object-contain rounded-lg"
        />
        {/* Title */}
        Add Offer / Discount
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Clinic */}

        <TextField
          size="small"
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff",
              borderRadius: "10px",
            },
          }}
          fullWidth
          label="Offer Title"
          name="offer_title"
          value={formData.offer_title}
          onChange={handleChange}
          error={!!errors.offer_title}
          helperText={errors.offer_title}
        />

        <TextField
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff",
              borderRadius: "10px",
            },
          }}
          fullWidth
          multiline
          rows={2}
          label="Offer Description"
          name="offer_description"
          value={formData.offer_description}
          onChange={handleChange}
          error={!!errors.offer_description}
          helperText={errors.offer_description}
        />

        {/* Upload */}

        <div>
          <label className="block text-sm font-semibold mb-2">
            Offer Banner
          </label>

          <label
            className={`flex items-center justify-center h-36 border-2 border-dashed rounded-xl cursor-pointer transition
            ${
              errors.offer_image
                ? "border-red-500"
                : "border-gray-300 hover:border-blue-500"
            }`}
          >
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={handleChange}
            />

            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center">
                <p className="font-medium">Click to Upload Image</p>

                <p className="text-sm text-gray-500 mt-2">JPG, PNG</p>
              </div>
            )}
          </label>
          {errors.offer_image && (
            <p className="text-red-500 text-sm mt-1 ml-5">
              {errors.offer_image}
            </p>
          )}
        </div>

        {/* Discount + Coupon */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#ffffff",
                borderRadius: "10px",
              },
            }}
            size="small"
            fullWidth
            type="number"
            label="Discount Percentage"
            name="discount_percentage"
            value={formData.discount_percentage}
            onChange={handleChange}
            error={!!errors.discount_percentage}
            helperText={errors.discount_percentage}
          />

          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#ffffff",
                borderRadius: "10px",
              },
            }}
            size="small"
            fullWidth
            label="Coupon Code"
            name="coupon_code"
            value={formData.coupon_code}
            onChange={handleChange}
            error={!!errors.coupon_code}
            helperText={errors.coupon_code}
            slotProps={{
              htmlInput: {
                maxLength: 15,
              },
            }}
          />
        </div>

        {/* Dates */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#ffffff",
                borderRadius: "10px",
              },
            }}
            size="small"
            fullWidth
            type="date"
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.start_date}
            helperText={errors.start_date}
            slotProps={{
              htmlInput: {
                min: today,
              },
            }}
          />

          <TextField
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#ffffff",
                borderRadius: "10px",
              },
            }}
            size="small"
            fullWidth
            type="date"
            label="End Date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={!!errors.end_date}
            helperText={errors.end_date}
            slotProps={{
              htmlInput: {
                min: formData.start_date || today,
              },
            }}
          />
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="contained" type="submit">
            Save Offer
          </Button>

          <Button variant="outlined" color="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
        {/* </div> */}
      </form>
    </div>
  );
};

export default OffersDiscount;
