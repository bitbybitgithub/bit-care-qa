
import React, { useEffect, useState } from "react";
import {
 Button,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

import { getBlogListApi, getBlogByIdApi } from "../../api";
import type { BlogFormData } from "../../types/types";
import { useNavigate, useParams  } from "react-router-dom";

// interface Blog {
//   blog_id: number;
//   clinic_id: number;
//   title: string;
//   short_description: string;
//   featured_image_path: string;
//   featured_image_guid: string;
//   featured_image_name: string;
//   category_id: number;
//   status: boolean;
//   created_date: string;
// }

const BlogsList: React.FC = () => {
  const categoryNames: Record<number, string> = {
  1: "Diabetes",
  2: "Cardiology",
  3: "Nutrition",
};  
  const navigate = useNavigate();
  const { blogId } = useParams();

  console.log("BLOG ID FROM URL:", blogId);

  const [blogs, setBlogs] = useState<BlogFormData[]>([]);
  const [blog, setBlog] = useState<BlogFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

//   useEffect(() => {
//     const fetchBlogs = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const response = await getBlogListApi();

//         console.log("BLOG LIST RESPONSE:", response);
//         console.log("BLOG LIST DATA:", response.data);

//         setBlogs(response.data);
//       } catch (error) {
//         console.error("GET BLOG LIST ERROR:", error);

//         setError("Unable to load blogs.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBlogs();
//   }, []);

  useEffect(() => {
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError("");

      if (blogId) {
        const response = await getBlogByIdApi(blogId);

        console.log("BLOG DETAILS RESPONSE:", response);
        console.log("BLOG DETAILS DATA:", response.data);

        setBlog(response.data);
      } else {
        const response = await getBlogListApi();

        console.log("BLOG LIST RESPONSE:", response);
        console.log("BLOG LIST DATA:", response.data);

        setBlogs(response.data);
      }
    } catch (error) {
      console.error("GET BLOG ERROR:", error);

      setError("Unable to load blog.");
    } finally {
      setLoading(false);
    }
  };

  fetchBlogs();
}, [blogId]);

  return (
    <Box
      sx={{       
        margin: "0 auto",
        padding: {
          xs: "20px",
          md: "35px 25px",
        },
         backgroundColor: "#ffffff",
      }}
    >
      {/* PAGE HEADER */}

      <Box
        sx={{
          textAlign: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            fontSize: {
              xs: "30px",
              md: "40px",
            },
            mb: 1,
          }}
        >
          Health & Wellness Blogs
        </Typography>

        <Typography
          variant="body1"
          color="text.primary"
          sx={{
            maxWidth: "650px",
            margin: "0 auto",
            fontSize: "16px",
          }}
        >
          Explore our latest health articles, expert insights, and helpful
          information to support your journey towards better health.
        </Typography>
      </Box>

      {/* LOADING */}

      {loading && (
        <Typography
          textAlign="center"
          color="text.secondary"
        >
          Loading blogs...
        </Typography>
      )}

      {/* ERROR */}

      {!loading && error && (
        <Typography
          textAlign="center"
          color="error"
        >
          {error}
        </Typography>
      )}

      {/* NO BLOGS */}

      {!loading && !error && !blogId && blogs.length === 0 && (
        <Typography
          textAlign="center"
          color="text.secondary"
        >
          No blogs available.
        </Typography>
      )}

      {/* BLOG DETAILS */}

        {!loading && !error && blogId && blog && (
        <Card
            sx={{
            maxWidth: "1000px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            }}
        >
            <Box
            component="img"
            src={`https://cliniccareapi.bitbybitsolutions.co.in/api/blog-images/${blog.featured_image_guid}`}
            alt={blog.title}
            sx={{
                width: "100%",
                height: "400px",
                objectFit: "cover",
                display: "block",
            }}
            />

            <CardContent
            sx={{
                padding: {
                xs: "20px",
                md: "40px",
                },
                backgroundColor: "#ffffff",
            }}
            >
            
            <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                gap: 1,
            }}
            >
            <Chip
            label={categoryNames[Number(blog.category_id)]}
            size="small"
            sx={{
            fontWeight: 600,
            mb: 2,
            }}
            />
            <Typography
                variant="body2"
                color="text.primary"
                sx={{ mb: 2 }}
            >
                {blog.created_date
                ? new Date(blog.created_date).toLocaleDateString("en-GB")
                : ""}
            </Typography>                   
            </Box>
            
            <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                mb: 2,
                lineHeight: 1.3,
                color: "#000000",
                }}
            >
                {blog.title}
            </Typography>

            <Typography
                variant="h6"
                sx={{
                mb: 3,
                lineHeight: 1.6,
                color: "#000000",
                }}
            >
                {blog.short_description}
            </Typography>

            <Box
                sx={{
                color: "#000000",
                lineHeight: 1.8,
                backgroundColor: "#ffffff",
                }}
                dangerouslySetInnerHTML={{
                __html: blog.content,
                }}
            />
            </CardContent>
        </Card>
        )}

        {/* BACK TO BLOGS */}

        {blogId && (
            <Box
            sx={{
                mb: 1,
                
            }}
            >
            <Button
                variant="outlined"
                onClick={() => navigate("/bloglist")}
                sx={{
                color: "text.secondary",
                borderColor: "secondary",
            }}
            >
                ← Back to Blogs
            </Button>
            </Box>
        )}

      {/* BLOG CARDS */}

      {!loading && !error && !blogId && blogs.length > 0 && (
        <Grid container spacing={3}>
          {blogs.map((blog, index) => (
            <Grid           
              key={blog.blog_id ?? index}
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  transition: "all 0.25s ease",

                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow:
                      "0 10px 25px rgba(0,0,0,0.14)",
                  },
                }}
              >
                {/* BLOG IMAGE */}

                <Box
                  component="img"
                  src={`http://localhost:8989/api/blog-images/${blog.featured_image_guid}`}
                  alt={blog.title}
                  sx={{
                    width: "100%",
                    height: "210px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    padding: "20px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {/* CATEGORY + DATE */}

                  <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                        gap: 1,
                    }}
                    >
                    <Chip
                        label={categoryNames[Number(blog.category_id)]}
                        size="small"
                        sx={{
                        fontWeight: 600,
                        }}
                    />

                    <Typography
                        variant="caption"
                        color="text.primary"
                    >
                        {blog.created_date
                        ? new Date(blog.created_date).toLocaleDateString("en-GB")
                        : ""}
                    </Typography>
                    </Box>

                    {/* <Typography
                    variant="caption"
                    color="text.primary"
                    sx={{ mb: 1 }}
                    >
                    Blog ID: {blog.blog_id} | Clinic ID: {blog.clinic_id}
                    </Typography> */}

                  {/* <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={`Category ${blog.category_id}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                      }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {new Date(
                        blog.created_date
                      ).toLocaleDateString()}
                    </Typography>
                  </Box> */}

                  {/* TITLE */}

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      mb: 1,
                      lineHeight: 1.35,
                    }}
                  >
                    {blog.title}
                  </Typography>

                  {/* SHORT DESCRIPTION */}

                  <Typography
                    variant="body2"
                    color="text.primary"
                    sx={{
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {blog.short_description}
                  </Typography>

                  {/* READ ARTICLE */}

                  <Box
                    sx={{
                      marginTop: "auto",
                      paddingTop: "18px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    //   onClick={() => console.log("SELECTED BLOG ID:", blog.blog_id)}
                    onClick={() => navigate(`/blog/${blog.blog_id}`)}
                    >
                      Read Article →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default BlogsList;

