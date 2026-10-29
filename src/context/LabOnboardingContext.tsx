import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getSessionItem } from "./sessions/userSession";
import { Roles, EntityType } from "./constant/enum";
import { fetchLabProfile } from "../api/labApis/LabApi";

interface LabOnboardingContextType {
  isOnboardingCompleted: boolean;
  isLoading: boolean;
  isLabAdmin: boolean;
  refreshOnboardingStatus: () => Promise<boolean>;
}

const LabOnboardingContext = createContext<LabOnboardingContextType>({
  isOnboardingCompleted: true,
  isLoading: false,
  isLabAdmin: false,
  refreshOnboardingStatus: async () => true,
});

export const LabOnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const role = getSessionItem("user", "role");
  const entityType = getSessionItem("user", "entity_type");
  const labId = getSessionItem("user", "lab_id");

  // Only apply onboarding restrictions to Lab Admin
  const isLabAdmin =
    role === Roles.Admin &&
    (entityType === EntityType.Lab || Boolean(labId));

  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(isLabAdmin);

  const checkStatus = useCallback(async (): Promise<boolean> => {
    if (!isLabAdmin || !labId) {
      setIsOnboardingCompleted(true);
      setIsLoading(false);
      return true;
    }

    try {
      const response = await fetchLabProfile(Number(labId));
      const labObj = response?.lab ?? response?.data?.lab;
      if (labObj) {
        const rawStatus =
          response?.lab?.service_onboarding_completed ??
          response?.data?.lab?.service_onboarding_completed;

        const isCompleted =
          rawStatus !== null &&
          rawStatus !== undefined &&
          Number(rawStatus) === 1;

        setIsOnboardingCompleted(isCompleted);
        return isCompleted;
      } else {
        // Treat unknown status conservatively
        setIsOnboardingCompleted(false);
        return false;
      }
    } catch (error) {
      console.error("Failed to check lab onboarding status:", error);
      // API failure does not unlock restricted menus
      setIsOnboardingCompleted(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLabAdmin, labId]);

  useEffect(() => {
    if (isLabAdmin && labId) {
      checkStatus();
    } else {
      setIsOnboardingCompleted(true);
      setIsLoading(false);
    }
  }, [isLabAdmin, labId, checkStatus]);

  const refreshOnboardingStatus = useCallback(async (): Promise<boolean> => {
    return await checkStatus();
  }, [checkStatus]);

  return (
    <LabOnboardingContext.Provider
      value={{
        isOnboardingCompleted,
        isLoading,
        isLabAdmin,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </LabOnboardingContext.Provider>
  );
};

export const useLabOnboarding = () => useContext(LabOnboardingContext);
export default LabOnboardingContext;

