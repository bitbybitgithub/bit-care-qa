//creating Context API for contest data
export const OtpType = {
  MOBILE_VERIFICATION: "MOBILE_VERIFICATION",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
} as const;

export type OtpType = (typeof OtpType)[keyof typeof OtpType];
