import axios from "axios";

export const getPincodeDetails = async (pincode: string) => {
  try {
    const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    if (response.data && response.data[0].Status === "Success") {
      return response.data[0].PostOffice;
    }
    return [];
  } catch (error) {
    console.error("Error fetching pincode details:", error);
    return [];
  }
};
