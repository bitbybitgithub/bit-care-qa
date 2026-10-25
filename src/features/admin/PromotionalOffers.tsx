import React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CloseIcon from "@mui/icons-material/Close";

import { BASE_URL } from "../../services/EmrApi";
import { getPromotionalOffersApi } from "../../api";
import type { PromotionalOffer } from "../../types/types";
import { useNavigate } from "react-router-dom";
import { getSession } from "../../context/sessions/userSession";

interface PromotionalOffersProps {
  onEdit: (offer: PromotionalOffer) => void;
}

// const PromotionalOffers = () => {
const PromotionalOffers: React.FC<PromotionalOffersProps> = ({
  onEdit,
}) => {
  const [offers, setOffers] = useState<PromotionalOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<PromotionalOffer | null>(null);

  const navigate = useNavigate();

//   const fetchOffers = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await getPromotionalOffersApi();

//       console.log("PROMOTIONAL OFFERS RESPONSE:", response);
//       console.log("PROMOTIONAL OFFERS DATA:", response.data);

//       if (response.success && Array.isArray(response.data)) {
//         setOffers(response.data);

//         console.log(
//           "FIRST OFFER IMAGE:",
//           response.data[0]?.offer_image_path,
//           response.data[0]?.offer_image_guid,
//           response.data[0]?.offer_image_name
//         );
//       } else {
//         setOffers([]);
//         setError("Unable to load promotional offers. Please try again.");
//       }
//     } catch (err) {
//       console.error("Error fetching promotional offers:", err);
//       setOffers([]);
//       setError("Unable to load promotional offers. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };


const fetchOffers = async () => {
  try {
    setLoading(true);
    setError("");

    // Get the logged-in user's session
    const user = getSession("user");

    const centerId =
      user?.entity_type === 1
        ? user?.clinic_id
        : user?.entity_type === 2
          ? user?.lab_id
          : undefined;

    const centerType =
      user?.entity_type === 1
        ? "clinic"
        : user?.entity_type === 2
          ? "lab"
          : undefined;

    // Validate the logged-in user's center
    if (!centerId || !centerType) {
      setOffers([]);
      setError("Unable to identify the logged-in clinic or lab.");
      return;
    }

    // Fetch offers for this clinic or lab only
    const response = await getPromotionalOffersApi(
      centerId,
      centerType
    );

    if (response.success && Array.isArray(response.data)) {
      setOffers(response.data);

    } else {
      setOffers([]);
      setError("Unable to load promotional offers. Please try again.");
    }
  } catch (err) {
    console.error("Error fetching promotional offers:", err);
    setOffers([]);
    setError("Unable to load promotional offers. Please try again.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchOffers();
  }, []);

    const handleEdit = (offer: PromotionalOffer) => {
    navigate("/clinic/offers", {
        state: {
        offer,
        isEdit: true,
        },
    });
    };

  const handleCloseEdit = () => {
    setSelectedOffer(null);
  };

  // Existing image URL logic — unchanged
  const getImageUrl = (offer: PromotionalOffer) => {
    if (!offer.offer_image_guid) return "";

    return `${BASE_URL}/patient/patients/offer-images/${offer.offer_image_guid}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        mx: "auto",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 1.5, md: 2 },
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* PAGE HEADER — based on BlogsList UI */}
      <Box
        sx={{
          textAlign: "center",
          mb: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{
            fontSize: { xs: "20px", sm: "26px", md: "32px" },
            mb: 1,
            color: "#202124",
            letterSpacing: "-0.5px",
          }}
        >
          Promotional Offers
        </Typography>

        <Typography
          variant="body1"
          sx={{
            maxWidth: "650px",
            mx: "auto",
            fontSize: "15px",
            lineHeight: 1.8,
            color: "#626262",
          }}
        >
          Explore our latest promotional offers, exclusive discounts, and
          special deals available for you.
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mt: 2.5,
            px: 2,
            py: 1,
            borderRadius: "8px",
            backgroundColor: "#eef4ff",
            color: "#2856a6",
          }}
        >
          <LocalOfferOutlinedIcon fontSize="small" />

          <Typography fontSize="14px" fontWeight={600}>
            {offers.length} Total Offers
          </Typography>
        </Box>
      </Box>

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            mb: 3,
            borderRadius: "10px",
          }}
          action={
            <Button color="inherit" size="small" onClick={fetchOffers}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* NO OFFERS */}
      {!error && offers.length === 0 && (
        <Card
          elevation={0}
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            p: { xs: 3, md: 5 },
            textAlign: "center",
            border: "1px solid #eeeeee",
            borderRadius: "14px",
            backgroundColor: "#ffffff",
          }}
        >
          <LocalOfferOutlinedIcon
            sx={{
              fontSize: 52,
              color: "#94A3B8",
              mb: 1.5,
            }}
          />

          <Typography variant="h6" fontWeight={700} color="#202124">
            No promotional offers found
          </Typography>

          <Typography sx={{ mt: 1, color: "#626262" }}>
            Offers will appear here when they are available.
          </Typography>
        </Card>
      )}

      {/* OFFER CARDS */}
      {!error && offers.length > 0 && (
       <Grid
        container
        spacing={{ xs: 2, md: 2.5 }}
        sx={{
            maxWidth: "1200px",
            mx: "auto",
            alignItems: "stretch",
        }}
        >
          {offers.map((offer, index) => (
           <Grid
            key={offer.offer_id}
            size={{ xs: 12, sm: 6, md: 4 }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #eeeeee",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  transition:
                    "transform 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.13)",
                  },
                  animation: "offerFadeIn 0.6s ease-out both",
                  animationDelay: `${index * 120}ms`,
                  "@keyframes offerFadeIn": {
                    from: {
                      opacity: 0,
                      transform: "translateY(18px)",
                    },
                    to: {
                      opacity: 1,
                      transform: "translateY(0)",
                    },
                  },
                }}
              >
                {/* OFFER IMAGE */}
                <Box
                  sx={{
                    width: "100%",
                   height: { xs: "170px", md: "190px" },
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                    position: "relative",
                    "& img": {
                      transition: "transform 0.5s ease",
                    },
                    "&:hover img": {
                      transform: "scale(1.045)",
                    },
                  }}
                >
                  {getImageUrl(offer) ? (
                    <CardMedia
                      component="img"
                      image={getImageUrl(offer)}
                      alt={offer.offer_title}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        backgroundColor: "#f3f4f6",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#eef4ff",
                        color: "#2856a6",
                      }}
                    >
                      <LocalOfferOutlinedIcon sx={{ fontSize: 65 }} />
                    </Box>
                  )}

                  {/* DISCOUNT BADGE */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      px: 1.5,
                      py: 0.8,
                      borderRadius: "6px",
                      backgroundColor: "#e7f8ef",
                      color: "#15803d",
                      fontSize: "14px",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  >
                    {offer.discount_percentage}% OFF
                  </Box>
                </Box>

                {/* OFFER CONTENT */}
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    p: "14px 16px 16px",
                    backgroundColor: "#ffffff",
                  }}
                >
                
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                      mb: 1.2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{
                        lineHeight: 1.3,
                        fontSize: "14px",
                        color: "#202124",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {offer.offer_title}
                    </Typography>

                    <IconButton
                      aria-label={`Edit ${offer.offer_title}`}
                      onClick={() => handleEdit(offer)}
                      size="small"
                      sx={{
                        flexShrink: 0,
                        color: "#2856a6",
                        border: "1px solid #d5e2fa",
                        borderRadius: "7px",
                        "&:hover": {
                          backgroundColor: "#eef4ff",
                          borderColor: "#2856a6",
                        },
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* DESCRIPTION */}
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.5,
                        fontSize: "12px",
                        color: "#5f6368",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        overflowWrap: "anywhere",
                        minHeight: "36px",
                        mb: 1,
                    }}
                  >
                    {offer.offer_description}
                  </Typography>

                  {/* OFFER DETAILS */}
                  <Stack spacing={1} sx={{ mb: 1.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <ConfirmationNumberOutlinedIcon
                        fontSize="small"
                        sx={{ color: "#64748b", mt: "2px", flexShrink: 0 }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "13px",
                          color: "#626262",
                          overflowWrap: "anywhere",
                        }}
                      >
                        Coupon:{" "}
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                            color: "#2856a6",
                          }}
                        >
                          {offer.coupon_code || "No coupon"}
                        </Box>
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <CalendarMonthOutlinedIcon
                        fontSize="small"
                        sx={{ color: "#64748b", mt: "2px", flexShrink: 0 }}
                      />

                      <Typography
                        variant="body2"
                        sx={{ fontSize: "13px", color: "#626262" }}
                      >
                        {formatDate(offer.start_date)} –{" "}
                        {formatDate(offer.end_date)}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                    >
                      <LocationOnOutlinedIcon
                        fontSize="small"
                        sx={{ color: "#64748b", mt: "2px", flexShrink: 0 }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: "13px",
                          color: "#626262",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {offer.center_name || "Center"}
                        {offer.address ? ` · ${offer.address}` : ""}
                      </Typography>
                    </Stack>

                    {offer.phone && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <PhoneOutlinedIcon
                          fontSize="small"
                          sx={{
                            color: "#64748b",
                            mt: "2px",
                            flexShrink: 0,
                          }}
                        />

                        <Typography
                          variant="body2"
                          sx={{ fontSize: "13px", color: "#626262" }}
                        >
                          {offer.phone}
                        </Typography>
                      </Stack>
                    )}

                    {offer.email && (
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <EmailOutlinedIcon
                          fontSize="small"
                          sx={{
                            color: "#64748b",
                            mt: "2px",
                            flexShrink: 0,
                          }}
                        />

                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "13px",
                            color: "#626262",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {offer.email}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

     
    </Box>
  );
};

export default PromotionalOffers;
