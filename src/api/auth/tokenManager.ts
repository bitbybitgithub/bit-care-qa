import { BASE_URL } from "../../services/EmrApi";
import type { RefreshToken } from "../../types/types";

// tokenManager.ts
let accessToken: string | null = null;

export const TokenManager = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
async rehydrate(): Promise<void> {
    try {
         const ip = sessionStorage.getItem("client_ip") ||  "";

        const payload: RefreshToken = { ip_address: ip,platform:"web"};
      // Try refreshing token silently using the HttpOnly cookie
      const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
         method: "POST",
         credentials: "include",
           headers: {
        "Content-Type": "application/json",
      },
         body: payload && JSON.stringify(payload) ,
      });

      if (!res.ok) throw new Error("Failed to rehydrate token");

      const data = await res.json();
      if (!data.accessToken) throw new Error("No access token returned");

      accessToken = data.accessToken;
    } catch (err) {
      console.error("Token rehydrate failed", err);
      accessToken = null;
    }
  },

};
