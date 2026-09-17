import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import type { BlogFormData } from "../../types/types";

// Use your existing session function
import { getSession } from "../../context/sessions/userSession";
import bitcarelogo from "../../assets/BitCareLogo.png";
import {
  createBlogApi,
  uploadBlogImageApi,
} from "../../api";

const BlogForm: React.FC = () => {
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    short_description: "",
    content: "",

    // Temporary field for upload only
    featured_image: null,

    featured_image_path: "",
    featured_image_guid: "",
    featured_image_name: "",

    category_id: "",
    //author_id: "",

    status: false,
    //published_at: "",

    clinic_id: 58,
    created_by: 160,
    modified_by: null,
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------
  // Get logged-in user from session
  // ---------------------------------------------------------

  useEffect(() => {
    const sessionUser = getSession("user");

    console.log(" AJ AJ AJA AJ ", sessionUser);

    if (sessionUser) {
      setFormData((prev) => ({
        ...prev,
        clinic_id: sessionUser.clinic_id ?? "",
        created_by: sessionUser.user_id ?? "",
      }));
    }
  }, []);

  // ---------------------------------------------------------
  // Quill configuration
  // ---------------------------------------------------------

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "align",
    "link",
  ];

  // ---------------------------------------------------------
  // Handle normal inputs
  // ---------------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ---------------------------------------------------------
  // Handle Select
  // ---------------------------------------------------------

  const handleSelectChange = (e: any, field: "category_id" | "author_id") => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  // ---------------------------------------------------------
  // Handle Quill
  // ---------------------------------------------------------

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }));

    setErrors((prev) => ({
      ...prev,
      content: "",
    }));
  };

  // ---------------------------------------------------------
  // Handle status
  // ---------------------------------------------------------

  const handleStatusChange = (e: any) => {
    const isPublished = e.target.value === "published";

    setFormData((prev) => ({
      ...prev,
      status: true,
    }));
  };

  // ---------------------------------------------------------
  // Handle featured image
  // ---------------------------------------------------------

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        featured_image: "Only JPG, PNG or WEBP images are allowed.",
      }));

      return;
    }

    // Validate image size - 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        featured_image: "Image size should not exceed 5 MB.",
      }));

      return;
    }

    setFeaturedImage(file);

    setImagePreview(URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      featured_image: file,
      featured_image_name: file.name,
    }));

    setErrors((prev) => ({
      ...prev,
      featured_image: "",
    }));
  };

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Blog title is required.";
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = "Short description is required.";
    }

    // Remove HTML from Quill content for validation
    const plainContent = formData.content.replace(/<(.|\n)*?>/g, "").trim();

    if (!plainContent) {
      newErrors.content = "Blog content is required.";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category.";
    }

    // if (!formData.author_id) {
    //   newErrors.author_id = "Please select an author/doctor.";
    // }

    if (!formData.clinic_id) {
      newErrors.clinic_id = "Clinic information is missing.";
    }

    if (!formData.created_by) {
      newErrors.created_by = "Logged-in user information is missing.";
    }

    if (!featuredImage) {
      newErrors.featured_image = "Blog banner is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------
  // Save Blog
  // ---------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedFormData = {
      ...formData,
      status: true,
    };

    setFormData(updatedFormData);

    if (!validateForm()) {
      return;
    }

    try {
      console.log("BLOG DATA:", updatedFormData);
      console.log("FEATURED IMAGE:", featuredImage);

      // Step 1: Upload featured image
      const uploadResponse = await uploadBlogImageApi(formData.featured_image);

      console.log("Upload Response:", uploadResponse);
      console.log("Files:", uploadResponse.files);
      console.log("First File:", uploadResponse.files[0]);

      // Step 2: Create blog data with uploaded image details
      const blogData = {
        ...updatedFormData,

        featured_image_path:
          uploadResponse.files[0].path +
          "\\" +
          uploadResponse.files[0].guid_name,

        featured_image_guid: uploadResponse.files[0].guid_name,

        featured_image_name: uploadResponse.files[0].file_name,
      };

      console.log("FINAL BLOG DATA:", blogData);

      // Step 3: Save blog
      const res = await createBlogApi(blogData);

      console.log("BLOG API RESPONSE:", res);

      alert("Blog published successfully.");

      handleReset();
    } catch (error: any) {
      console.error("BLOG CREATE ERROR:", error);

      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong while saving the blog.";

      alert(msg);
    }
  };

  // const handleSubmit = async (
  //   e: React.FormEvent,
  // ) => {
  //   e.preventDefault();

  //   // Set status before validation
  //   const updatedFormData = {
  //   ...formData,
  //   status: true,
  //  };

  //   setFormData(updatedFormData);

  //   if (!validateForm()) {
  //     return;
  //   }

  //   try {
  //     console.log("BLOG DATA:", updatedFormData);
  //     console.log("FEATURED IMAGE:", featuredImage);

  //     /*
  //      * Here you can:
  //      *
  //      * 1. Upload featuredImage
  //      * 2. Get:
  //      *    featured_image_path
  //      *    featured_image_guid
  //      *    featured_image_name
  //      *
  //      * 3. Send blog data to API
  //      *
  //      * Example:
  //      *
  //      * await createBlogApi(updatedFormData);
  //      */

  //     alert("Blog published successfully.");
  //   } catch (error) {
  //     console.error("BLOG CREATE ERROR:", error);

  //     alert("Something went wrong while saving the blog.");
  //   }
  // };

  // ---------------------------------------------------------
  // Reset form
  // ---------------------------------------------------------

  const handleReset = () => {
    const sessionUser = getSession("user");

    setFormData({
      title: "",
      short_description: "",
      content: "",

      // Temporary field for upload only
      featured_image: null,

      featured_image_path: "",
      featured_image_guid: "",
      featured_image_name: "",

      category_id: "",
      //author_id: "",

      status: false,
      //published_at: "",

      clinic_id: sessionUser?.clinic_id ?? "",
      created_by: sessionUser?.user_id ?? "",
      modified_by: null,
    });

    setFeaturedImage(null);
    setImagePreview("");
    setErrors({});
  };

  return (
    <Box sx={{}}>
      {/* =====================================================
          PAGE TITLE
      ====================================================== */}

      {/* <Typography
        variant="h4"
        fontWeight={700}
        textAlign="center"
        mb={3}
      >
        Create Blog
      </Typography> */}

      <form className="bg-white border border-gray-400 rounded-2xl">
        {/* ===================================================
            SECTION 1 - BASIC INFORMATION
        ==================================================== */}

        <Card sx={{ mb: 2, backgroundColor: "white" }}>
          <CardContent>
            <h2 className="relative flex items-center justify-center h-20  text-black text-2xl font-bold border border-gray-400 rounded-2xl mb-4">
              {/* Logo */}
              <img
                src={bitcarelogo}
                alt="BitCare Logo"
                className="absolute left-1.5 w-35 h-18 bg-white object-contain rounded-lg"
              />
              {/* Title */}
              Create Blog
            </h2>

            <Grid container spacing={2}>
              {/* Title */}

              <Grid size={{ xs: 12 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Blog Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  placeholder="Enter blog title"
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#ffffff",
                    },
                  }}
                />
              </Grid>

              {/* Short Description */}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Short Description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  error={!!errors.short_description}
                  helperText={errors.short_description}
                  placeholder="Enter a short description"
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#ffffff",
                    },
                  }}
                />
              </Grid>

              {/* Category */}
              {/* 
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  error={!!errors.category_id}
                   size="small"
                   sx={{
                    "& .MuiInputBase-root": {
                        backgroundColor: "#ffffff",
                    },}}
                >
                  <InputLabel>Category</InputLabel>

                  <Select
                    value={formData.category_id}
                    label="Category"
                    onChange={(e) =>
                      handleSelectChange(e, "category_id")
                    }
                  >
                    <MenuItem value={1}>
                      Diabetes
                    </MenuItem>

                    <MenuItem value={2}>
                      Cardiology
                    </MenuItem>

                    <MenuItem value={3}>
                      Nutrition
                    </MenuItem>
                  </Select>

                  {errors.category_id && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ ml: 2 }}
                    >
                      {errors.category_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid> */}

              {/* Author */}

              {/* <Grid size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  error={!!errors.author_id}
                  size="small"
                   sx={{
                    "& .MuiInputBase-root": {
                        backgroundColor: "#ffffff",
                    },}}
                >
                  <InputLabel>
                    Author / Doctor
                  </InputLabel>

                  <Select
                    value={formData.author_id}
                    label="Author / Doctor"
                    onChange={(e) =>
                      handleSelectChange(e, "author_id")
                    }
                  >
                    <MenuItem value={25}>
                      Dr. ABC
                    </MenuItem>

                    <MenuItem value={26}>
                      Dr. XYZ
                    </MenuItem>
                  </Select>

                  {errors.author_id && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ ml: 2 }}
                    >
                      {errors.author_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid> */}
            </Grid>
          </CardContent>
        </Card>

        {/* ===================================================
            SECTION 2 - FEATURED IMAGE
        ==================================================== */}

        <Card
          sx={{
            mb: 2,
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Blog Banner
            </Typography>

            <Button variant="outlined" component="label">
              Upload Blog Banner
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </Button>

            {errors.featured_image && (
              <Typography color="error" variant="body2" mt={1}>
                {errors.featured_image}
              </Typography>
            )}

            {imagePreview && (
              <Box mt={3}>
                <Typography variant="body2" mb={1} fontWeight={600}>
                  Preview
                </Typography>

                <Box
                  component="img"
                  src={imagePreview}
                  alt="Featured"
                  sx={{
                    width: "300px",
                    maxHeight: "200px",
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            )}

            {formData.featured_image_name && (
              <Typography variant="body2" mt={1}>
                Selected: {formData.featured_image_name}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* ===================================================
            SECTION 3 - BLOG CONTENT
        ==================================================== */}

        <Card
          sx={{
            mb: 2,
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Blog Content
            </Typography>

            <Box
              sx={{
                "& .ql-container": {
                  minHeight: "100px",
                  fontSize: "16px",
                },
                "& .ql-editor": {
                  minHeight: "100px",
                },
              }}
            >
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your blog content here..."
              />
            </Box>

            {errors.content && (
              <Typography color="error" variant="body2" mt={1}>
                {errors.content}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* ===================================================
            SECTION 4 - PUBLISHING
        ==================================================== */}

        <Card
          sx={{
            mb: 3,
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Publishing
            </Typography>

            <Grid container spacing={3}>
              {/* Category */}

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  error={!!errors.category_id}
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#ffffff",
                    },
                  }}
                >
                  <InputLabel>Category</InputLabel>

                  <Select
                    value={formData.category_id}
                    label="Category"
                    onChange={(e) => handleSelectChange(e, "category_id")}
                  >
                    <MenuItem value={1}>Diabetes</MenuItem>

                    <MenuItem value={2}>Cardiology</MenuItem>

                    <MenuItem value={3}>Nutrition</MenuItem>
                  </Select>

                  {errors.category_id && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {errors.category_id}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Status */}

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#ffffff",
                    },
                  }}
                >
                  <InputLabel>Status</InputLabel>

                  <Select
                    value="published"
                    label="Status"
                    onChange={handleStatusChange}
                  >
                    <MenuItem value="published">Published</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Published Date */}

              {/* {formData.status && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                   sx={{
                    "& .MuiInputBase-root": {
                        backgroundColor: "#ffffff",
                    },}}
                    label="Published Date"
                    value={
                      formData.published_at
                        ? new Date(
                            formData.published_at
                          ).toLocaleString()
                        : ""
                    }
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              )} */}
            </Grid>
          </CardContent>
        </Card>

        {/* ===================================================
            BUTTONS
        ==================================================== */}

        <Box display="flex" justifyContent="center" gap={2} mb={2}>
          <Button variant="contained" onClick={handleSubmit}>
            Save Blog
          </Button>
          <Button variant="outlined" color="inherit" onClick={handleReset}>
            Reset
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default BlogForm;
