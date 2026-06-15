
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