import React, { useEffect, useState } from 'react'
import NewUsers from '../components/NewUsers'
import { toast } from 'react-toastify';
import { getSessionItem } from '../../../../context/sessions/userSession';
import { getEnquiryListApi, type ApiUser, type User } from '../../api/SupportApi';

const SupportDashboard: React.FC = () => {
 
  const [data, setData] = useState<User[]>([]);
  const entity_type = getSessionItem("user", "entity_type");
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getEnquiryListApi(entity_type);
        console.log(response)
        const mapped: User[] = response.map((item) => ({
          enquiry_id: item.enquiry_id,
          name: item.name,
          phone: item.phone,
          email: item.email,
          address: item.address,
          pincode: item.pincode,
          city: item.city,
          district: item.district,
          state_name: item.state_name,
          is_approved: item.is_approved,
          created_date: item.created_date,
          status:
            item.is_approved === "1"
              ? "approved"
              : item.is_approved === "0"
                ? "rejected"
                : "pending",
        }));

        setData(mapped); 
      } catch (error: any) {
        console.log("ERROR:", error?.response || error.message);
        toast.error("Something went wrong");
      }
    };

    fetchData();
  }, []);
  return (
    <>
      <NewUsers
        data={data}
        setData={setData}
      />
    </>
  )
}

export default SupportDashboard