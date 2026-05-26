// import axios from "axios";
// import { PincodeUrl } from "../utils/Utils"; 

// export const getPincodeDetails = async (pincode: string) => {
//   try {
//     const response = await axios.get(`${PincodeUrl}${pincode}`);
//     if (response.data && response.data[0].Status === "Success") {
//       return response.data[0].PostOffice;
//     }
//     return [];
//   } catch (error) {
//     console.error("Error fetching pincode details:", error);
//     return [];
//   }
// };

export const getPincodeDetails = async (pincode: string) => {
  try {
    const res = await fetch(`https://api.zippopotam.us/in/${pincode}`);

    const data = await res.json();
    if (data?.places?.length > 0) {
      return data.places.map((place: any) => ({
        State: place.state || "",
        District: place.state || "",
        Name: place["place name"] || "",
      }));
    }
    return [];
  } catch (error) {
    console.error(error);
    return null;
  }
};