// // src/hooks/useClientIp.ts
// import { useEffect, useState } from "react";

// export default function useClientIp() {
//   const [ip, setIp] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     let cancelled = false;
//     setLoading(true);
//     fetch("https://api.ipify.org?format=json")
//       .then((r) => r.json())
//       .then((data) => {
//         if (!cancelled) setIp(data.ip);
//       })
//       .catch((err) => {
//         if (!cancelled) setError(err.message || "Failed to fetch IP");
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });
//     return () => { cancelled = true; };
//   }, []);

//   console.log("Ip Data",ip)
//   return { ip, loading, error };
// }

import axios from 'axios';
import platform from 'platform';
import  { useEffect, useState } from 'react'

export default function useFetchIpAndBrowserName() {
    const [ip, setIp] = useState<string | null>(null);
    const [browserName, setBrowserName] = useState('');

   const IpAddressAndBrowserName = async () => {
       await axios.get("https://geolocation-db.com/json/")
           .then(res => {
               setIp(res.data.IPv4)  
       })
       setBrowserName(platform.name);
    };
    
    useEffect(() => {
        IpAddressAndBrowserName();
    },[])
    return {ip, browserName }
}
