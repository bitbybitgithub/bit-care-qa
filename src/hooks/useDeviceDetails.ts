import { useCallback, useEffect, useState } from "react";

export interface DeviceLocation {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

export interface DeviceDetails {
  ipAddress: string | null;
  location: DeviceLocation;
  deviceType: "Mobile" | "Tablet" | "Desktop" | "Unknown";
  browser: string;
  operatingSystem: string;
  screenResolution: string;
  language: string;
  timezone: string;
  isOnline: boolean;
  userAgent: string;
}

interface UseDeviceDetailsReturn {
  deviceDetails: DeviceDetails;
  loading: boolean;
  locationLoading: boolean;
  ipLoading: boolean;
  error: string | null;
  getLocation: () => void;
  refreshDeviceDetails: () => void;
}

const getInitialDeviceDetails = (): DeviceDetails => {
  if (typeof window === "undefined") {
    return {
      ipAddress: null,
      location: {
        latitude: null,
        longitude: null,
        accuracy: null,
      },
      deviceType: "Unknown",
      browser: "Unknown",
      operatingSystem: "Unknown",
      screenResolution: "Unknown",
      language: "Unknown",
      timezone: "Unknown",
      isOnline: false,
      userAgent: "",
    };
  }

  return {
    ipAddress: null,
    location: {
      latitude: null,
      longitude: null,
      accuracy: null,
    },
    deviceType: getDeviceType(),
    browser: getBrowser(),
    operatingSystem: getOperatingSystem(),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isOnline: navigator.onLine,
    userAgent: navigator.userAgent,
  };
};

const getDeviceType = (): DeviceDetails["deviceType"] => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet|playbook|silk/.test(userAgent)) {
    return "Tablet";
  }

  if (/mobi|android|iphone|ipod|blackberry|windows phone/.test(userAgent)) {
    return "Mobile";
  }

  return "Desktop";
};

const getBrowser = (): string => {
  const userAgent = navigator.userAgent;

  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Google Chrome";
  if (/firefox|fxios/i.test(userAgent)) return "Mozilla Firefox";
  if (/safari/i.test(userAgent)) return "Safari";

  return "Unknown";
};

const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent;

  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/mac os x/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";

  return "Unknown";
};

export const useDeviceDetails = (): UseDeviceDetailsReturn => {
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetails>(
    getInitialDeviceDetails,
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [ipLoading, setIpLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get Public IP Address
  const getIpAddress = useCallback(async () => {
    setIpLoading(true);

    try {
      const response = await fetch("https://api.ipify.org?format=json");

      if (!response.ok) {
        throw new Error("Failed to fetch IP address");
      }

      const data: { ip: string } = await response.json();

      setDeviceDetails((prev) => ({
        ...prev,
        ipAddress: data.ip,
      }));
    } catch (err) {
      console.error("IP Address Error:", err);

      setError("Unable to fetch IP address");
    } finally {
      setIpLoading(false);
    }
  }, []);

  // Get Current Device Location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setLocationLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        setDeviceDetails((prev) => ({
          ...prev,
          location: {
            latitude,
            longitude,
            accuracy,
          },
        }));

        setLocationLoading(false);
      },
      (geoError) => {
        let message = "Unable to get location";

        switch (geoError.code) {
          case 1:
            message =
              "Location permission denied. Please allow location access.";
            break;

          case 2:
            message =
              "Location unavailable. Check your device location settings.";
            break;

          case 3:
            message = "Location request timed out. Please try again.";
            break;
        }

        console.error("Geolocation Error:", {
          code: geoError.code,
          message: geoError.message,
        });

        setError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, []);

  // Refresh All Device Details
  const refreshDeviceDetails = useCallback(() => {
    setError(null);

    setDeviceDetails((prev) => ({
      ...prev,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      operatingSystem: getOperatingSystem(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isOnline: navigator.onLine,
      userAgent: navigator.userAgent,
    }));

    getIpAddress();
  }, [getIpAddress]);

  // Initial Load
  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      setLoading(true);
      setError(null);

      await getIpAddress();

      if (isMounted) {
        setLoading(false);
      }

      // Automatically request device location
      getLocation();
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [getIpAddress, getLocation]);

  // Online / Offline Listener
  useEffect(() => {
    const handleOnline = () => {
      setDeviceDetails((prev) => ({
        ...prev,
        isOnline: true,
      }));
    };

    const handleOffline = () => {
      setDeviceDetails((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    deviceDetails,
    loading,
    locationLoading,
    ipLoading,
    error,
    getLocation,
    refreshDeviceDetails,
  };
};
