import React, { useState } from "react";
import bitcarelogo from "../../assets/BitCareLogo.png"
import {
  TextField,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import type {
  OfferForm,
  FormDataBase,
  LocationItem,
  ValidationErrors,
} from "../../types/types";
import {
  offersdiscountApi,
  uploadOfferImageApi,
  getEntityTypes,
  getPincodeDetails,
  registerApi,
  type Entity,
} from "../../api";
import { toast } from "react-toastify";
import { getSession } from "../../context/sessions/userSession";

const clinics = [
  { id: 1, name: "Clinic" },
  { id: 2, name: "Hospital"},
  { id: 3, name: "laboratory/Pathology" },
];

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
//   const [errors, setErrors] = useState({
//   offer_title: "",
//   offer_description: "",
//   offer_image: "",
//   discount_percentage: "",
//   coupon_code: "",
//   start_date: "",
//   end_date: "",
//   priority: "",
// });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OfferForm>({
      // center_id: 10,
      // center_name: "",
      // center_type: "",

      offer_title: "",
      offer_description: "",

      offer_image: null,   // ✅ Required

      offer_image_path: "",
      offer_image_guid: "",
      offer_image_name: "",

      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: 0,
      created_by: "Admin",
 });
  
  const [preview, setPreview] = useState("");
  const user = getSession("user");

  const handleChange = (e) => {
  const { name, value, files, checked, type } = e.target;

  // Handle file upload
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
      // Allow up to 2 digits before decimal and up to 2 digits after decimal
      const regex = /^\d{0,2}(\.\d{0,2})?$/;
      const discount = Number(value);

      if (value !== "" && (!regex.test(value) || discount >= 100)) {
        return;
      }
    }

  // Handle all other fields
  setFormData((prev) => ({
    ...prev,
    [name]:
      type === "checkbox"
        ? checked
        : type === "number"
        ? (value === "" ? "" : Number(value))
      : value,
  }));

  setErrors((prev) => ({
  ...prev,
  [name]: "",
}));
};

//   const handleChange = (e) => {
//     const { name, value, files, checked, type } = e.target;

//     if (files && files.length > 0) {
//   const file = files[0];

//   setFormData((prev) => ({
//     ...prev,
//     offer_image: file, // Store the actual File object
//   }));

//   setPreview(URL.createObjectURL(file));
// }

//     // if (files) {
//     //   const file = files[0];

//     //   setFormData((prev) => ({
//     //     ...prev,
//     //     offer_image: file,
//     //   }));    setPreview(URL.createObjectURL(file));
//     // } else {
//     //   setFormData((prev) => ({
//     //     ...prev,
//     //     [name]: type === "checkbox" ? checked : value,
//     //   }));
//     // }
//   };


//  const validateForm = () => {
//   if (!formData.offer_title.trim())
//     return "Offer Title is required.";

//   if (!formData.offer_description.trim())
//     return "Offer Description is required.";

//   if (!formData.offer_image)
//     return "Please upload an image.";

//   if (formData.discount_percentage <= 0)
//     return "Discount Percentage is required.";

//   if (!formData.coupon_code.trim())
//     return "Coupon Code is required.";

//   if (!formData.start_date)
//     return "Start Date is required.";

//   if (!formData.end_date)
//     return "End Date is required.";

//   // if (!formData.priority)
//   //   return "Priority is required.";

//   return null;
// };

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

  // if (formData.discount_percentage <= 0)
  //   newErrors.discount_percentage = "Enter discount percentage.";

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

  if (!formData.start_date)
    newErrors.start_date = "Start Date is required.";

  if (!formData.end_date)
    newErrors.end_date = "End Date is required.";

  if (!formData.offer_image)
    newErrors.offer_image = "Image is required.";

  setErrors(newErrors);

  return Object.values(newErrors).every((x) => x === "");
};


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = getSession("user");

    console.log("OFFER USER SESSION:", user);
    console.log("CLINIC ID:", user.clinic_id);
    console.log("USER ID:", user.user_id);
    console.log("CENTER NAME:", user.full_name);
    console.log("CENTER TYPE:", user.entity_name);
    
    // const error = validateForm();

    //   if (error) {
    //     toast.error(error);
    //     return;
    //   }

      if (!validateForm()) {
          return;
      }

      setLoading(true);
  
      try {

       // Step 1: Upload image
        const uploadResponse = await uploadOfferImageApi(formData.offer_image);



        console.log("Upload Response:", uploadResponse);
        console.log("Files:", uploadResponse.files);
        console.log("First File:", uploadResponse.files[0]);

        // Step 2: Get uploaded image path
        // const imagePath = uploadResponse.files[0].path;

        // // Step 3: Replace File object with saved image path
        // const offerData = {
        //   ...formData,
        //   offer_image: imagePath,
        // };

        // Step 2: Create object with uploaded image details
        const offerData = {
          ...formData,

            // Logged-in user/session data
            center_id: user.clinic_id,           
            center_name: user.full_name,
            center_type: user.entity_name,
            created_by:user.role,

          offer_image_path: uploadResponse.files[0].path +"\\"+ uploadResponse.files[0].guid_name,
          offer_image_guid: uploadResponse.files[0].guid_name,
          offer_image_name: uploadResponse.files[0].file_name,
        };

        const res = await offersdiscountApi (offerData);
  
        const normalized = {
          success: res?.success,
          message: res?.message,
          data: res?.data,
          error: res?.error,
          errors: res?.errors,
        };
  
        // const errMsg =
        //   normalized.message ||
        //   normalized.data?.message ||
        //   normalized.error ||
        //   (normalized.errors && Object.values(normalized.errors).join("\n")) ||
        //   "Something went wrong.";
  
        //  toast.success(errMsg);

        const message =
          normalized.message ||
          normalized.data?.message ||
          "Offer saved successfully.";

        toast.success(message);
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
    // center_id: 10,
    // center_name: "",
    // center_type: "",

    offer_title: "",
    offer_description: "",

    // Temporary field
    offer_image: null,

    // Database fields
    offer_image_path: "",
    offer_image_guid: "",
    offer_image_name: "",

    discount_percentage: "",
    coupon_code: "",

    start_date: "",
    end_date: "",

    priority: 0,

    created_by: "Admin",
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
              mb:2,
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
        
        

        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}

          {/* Priority */}

            {/* <TextField
            sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                },
              }}
              size="small"
              select
              fullWidth
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <MenuItem value={1}>High</MenuItem>
              <MenuItem value={2}>Medium</MenuItem>
              <MenuItem value={3}>Low</MenuItem>
            </TextField>
            */}

        {/* </div>      */}

        {/* Description */}

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

          <label className={`flex items-center justify-center h-36 border-2 border-dashed rounded-xl cursor-pointer transition
            ${
              errors.offer_image
                ? "border-red-500"
                : "border-gray-300 hover:border-blue-500"
            }`} >
          

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
                <p className="font-medium">
                  Click to Upload Image
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG
                </p>
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

        

        {/* Status */}

      {/* <div className="flex items-center justify-between mt-6"> */}
        {/* <FormControlLabel
          control={
            <Switch
              checked={formData.status}
              onChange={handleChange}
              name="status"
            />
          }
          label={formData.status ? "laboratory" : "Doctors Clinic"}
        /> */}

        <div className="flex justify-center gap-4">
          
          <Button
            variant="contained"
            type="submit"
          >
            Save Offer
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      {/* </div> */}

      </form>

    </div>
  );
};

export default OffersDiscount;
