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
import { useNavigate, useParams } from "react-router-dom";
import EditNoteIcon from "@mui/icons-material/EditNote";

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
        minHeight: "100vh",
        width: "100%",
        margin: "0 auto",
        padding: {
         xs: "12px 16px",
          sm: "16px 24px",
          md: "20px 30px",
        },
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
      }}
    >
      {/* PAGE HEADER */}
      <Box
        sx={{
          textAlign: "center",
          mb: { xs: 4, md: 5 },
          animation: "blogHeaderFade 0.6s ease-out both",
          "@keyframes blogHeaderFade": {
            from: {
              opacity: 0,
              transform: "translateY(12px)",
            },
            to: {
              opacity: 1,
              transform: "translateY(0)",
            },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        }}
      >
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            fontSize: {
              xs: "28px",
              sm: "34px",
              md: "40px",
            },
            mb: 0,
            color: "#202124",
            letterSpacing: "-0.6px",
          }}
        >
          Health & Wellness Blogs
        </Typography>

        <Typography
          variant="body1"
          sx={{
            maxWidth: "650px",
            margin: "0 auto",
            fontSize: "15px",
            lineHeight: 1.8,
            color: "#626262",
          }}
        >
          Explore our latest health articles, expert insights, and helpful
          information to support your journey towards better health.
        </Typography>
      </Box>

      {/* LOADING */}
      {loading && (
        <Typography textAlign="center" color="text.secondary">
          Loading blogs...
        </Typography>
      )}

      {/* ERROR */}
      {!loading && error && (
        <Typography textAlign="center" color="error">
          {error}
        </Typography>
      )}

      {/* NO BLOGS */}
      {!loading && !error && !blogId && blogs.length === 0 && (
        <Typography textAlign="center" color="text.secondary">
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
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 5px 22px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            component="img"
            src={`http://localhost:8989/api/blog-images/${blog.featured_image_guid}`}
            alt={blog.title}
            sx={{
              width: "100%",
              height: {
                xs: "230px",
                sm: "340px",
                md: "440px",
              },
              objectFit: "cover",
              display: "block",
              backgroundColor: "#f3f4f6",
            }}
          />

          <CardContent
            sx={{
              padding: {
                xs: "22px",
                sm: "30px",
                md: "42px 48px",
              },
              backgroundColor: "#ffffff",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                mb: 2,
                gap: 1,
              }}
            >
              <Chip
                label={categoryNames[Number(blog.category_id)]}
                size="small"
                sx={{
                  fontWeight: 600,
                  borderRadius: "6px",
                  backgroundColor: "#f1f3f5",
                  color: "#424242",
                }}
              />

              <Typography
                variant="body2"
                sx={{ color: "#777777" }}
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
                fontSize: {
                  xs: "26px",
                  sm: "31px",
                  md: "36px",
                },
                color: "#202124",
              }}
            >
              {blog.title}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                mb: 3,
                lineHeight: 1.8,
                fontSize: {
                  xs: "16px",
                  md: "18px",
                },
                fontWeight: 400,
                color: "#555555",
              }}
            >
              {blog.short_description}
            </Typography>

            <Box
              sx={{
                color: "#333333",
                lineHeight: 1.9,
                fontSize: "16px",
                backgroundColor: "#ffffff",
                overflowWrap: "anywhere",
                "& img": {
                  maxWidth: "100%",
                  height: "auto",
                },
                "& h2, & h3": {
                  color: "#202124",
                  mt: 3,
                  mb: 1.5,
                },
                "& p": {
                  mb: 2,
                },
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
            maxWidth: "1000px",
            margin: "20px auto 0",
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/clinic/BlogTabs")}
            sx={{
              color: "#555555",
              borderColor: "#d5d5d5",
              borderRadius: "7px",
              textTransform: "none",
              "&:hover": {
                borderColor: "#777777",
                backgroundColor: "#f8f8f8",
              },
            }}
          >
            ← Back to Blogs
          </Button>
        </Box>
      )}

      {/* BLOG CARDS */}
      {!loading && !error && !blogId && blogs.length > 0 && (
        <Grid
          container
          spacing={{ xs: 3, md: 3.5 }}
          sx={{
            maxWidth: "1200px",
            margin: "0 auto",
            alignItems: "stretch",
          }}
        >
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
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #eeeeee",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.07)",

                  animation: "blogCardFade 0.55s ease-out both",
                  animationDelay: `${Math.min(index * 100, 500)}ms`,

                  transition:
                    "transform 0.3s ease, box-shadow 0.3s ease",

                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 26px rgba(0,0,0,0.13)",
                  },

                  "@keyframes blogCardFade": {
                    from: {
                      opacity: 0,
                      transform: "translateY(15px)",
                    },
                    to: {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },

                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                    transition: "none",
                    "&:hover": {
                      transform: "none",
                    },
                  },
                }}
              >
                {/* BLOG IMAGE */}
                <Box
                  sx={{
                    width: "100%",
                    height: {
                      xs: "240px",
                      sm: "250px",
                      md: "290px",
                    },
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                    flexShrink: 0,
                    "&:hover img": {
                      transform: "scale(1.045)",
                    },
                    "@media (prefers-reduced-motion: reduce)": {
                      "&:hover img": {
                        transform: "none",
                      },
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={`http://localhost:8989/api/blog-images/${blog.featured_image_guid}`}
                    alt={blog.title}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.5s ease",
                    }}
                  />
                </Box>

                {/* BLOG CONTENT */}
                <CardContent
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    width: "calc(100% - 36px)",
                    boxSizing: "border-box",
                    alignSelf: "center",
                    marginTop: { xs: "-48px", md: "-58px" },
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    padding: "18px 18px 22px",
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    boxShadow: "0 5px 18px rgba(0,0,0,0.10)",
                    "&:last-child": {
                      paddingBottom: "22px",
                    },
                  }}

                >
                  {/* TITLE */}
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      mb: 1.2,
                      lineHeight: 1.4,
                      fontSize: "17px",
                      color: "#292929",
                    }}
                  >
                    {blog.title}
                  </Typography>

                  {/* SHORT DESCRIPTION */}
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.75,
                      fontSize: "13px",
                      color: "#666666",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {blog.short_description}
                  </Typography>

                  {/* READ ARTICLE + EDIT */}
                  <Box
                    sx={{
                      marginTop: "auto",
                      paddingTop: "18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 500,
                        fontSize: "13px",
                        color: "#333333",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "4px",
                        transition: "color 0.2s ease",
                        "&:hover": {
                          color: "#1976d2",
                        },
                      }}
                      onClick={() => navigate(`/blog/${blog.blog_id}`)}
                    >
                      Read Article →
                    </Typography>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditNoteIcon />}
                      onClick={() => {
                        navigate(
                          `/clinic/BlogTabs/blog/edit/${blog.blog_id}`
                        );
                      }}
                      sx={{
                        minWidth: "36px",
                        borderRadius: "6px",
                        borderColor: "#e0e0e0",
                        color: "#555555",
                        textTransform: "none",
                        "&:hover": {
                          borderColor: "#999999",
                          backgroundColor: "#f8f8f8",
                        },
                      }}
                    >
                      Edit
                    </Button>
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
