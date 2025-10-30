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
};
