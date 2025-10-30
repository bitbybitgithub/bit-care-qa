// src/api/api.ts
import { TokenManager } from "./auth/tokenManager";
import type { RefreshToken } from "../types/types";

const BASE_URL = "http://localhost:8989/api";

// -------------------- //
//  Interceptor Hooks
// -------------------- //
type InterceptorHooks = {
  onRequestStart?: (url: string) => void;
  onRequestEnd?: (url: string) => void;
  onAuthError?: () => void;
};

const interceptors: InterceptorHooks = {};

export const ApiInterceptor = {
  set: (hooks: InterceptorHooks) => Object.assign(interceptors, hooks),
};

// -------------------- //
//   Header Builder
// -------------------- //
const getHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const token = TokenManager.getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

// -------------------- //
//  Timeout Helper
// -------------------- //
const fetchWithTimeout = (
  url: string,
  options: RequestInit,
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal, credentials: "include" }).finally(() =>
    clearTimeout(timer)
  );
};

// -------------------- //
//   Token Refresh Logic
// -------------------- //
let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

const refreshAccessToken = async (payload?: RefreshToken): Promise<string | null> => {
  if (isRefreshing) {
    await new Promise<void>((resolve) => refreshQueue.push(resolve));
    return TokenManager.getAccessToken();
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // sends cookies for session refresh
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!res.ok) throw new Error("Failed to refresh token");

    const data = await res.json();
    if (!data.accessToken) throw new Error("No access token returned");

    TokenManager.setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (err) {
    console.error("Token refresh failed", err);
    TokenManager.clear();
    interceptors.onAuthError?.(); // trigger global logout
    return null;
  } finally {
    isRefreshing = false;
    refreshQueue.forEach((resolve) => resolve());
    refreshQueue = [];
  }
};

// -------------------- //
//   Request Core
// -------------------- //
async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
  timeout = 10000,
  retry = true
): Promise<T> {
  const fullUrl = `${BASE_URL}${url}`;
  interceptors.onRequestStart?.(fullUrl);

  try {
    const response = await fetchWithTimeout(
      fullUrl,
      { ...options, headers: getHeaders(options.headers), credentials: "include" },
      timeout
    );

    // Handle 403 -> try refresh
    if (response.status === 403  && retry) {
      // You cannot use a hook here — get IP another way
      const ip = sessionStorage.getItem("client_ip") ||  "";

      const payload: RefreshToken = { ip_address: ip,platform:"web"};
      const newToken = await refreshAccessToken(payload);

      if (newToken) {
        return await request<T>(url, options, timeout, false);
      }

      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const text = await response.text();
      let message = text || `HTTP error ${response.status}`;
      try {
        const json = JSON.parse(text);
        message = json.message || message;
      } catch {}
      throw new Error(message);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("Request timed out");
    console.error("API error:", error);
    throw error;
  } finally {
    interceptors.onRequestEnd?.(fullUrl);
  }
}

// -------------------- //
//   Unified API Object
// -------------------- //
export const emrAPI = {
  get: <T = unknown>(url: string, timeout?: number) =>
    request<T>(url, { method: "GET" }, timeout),
  post: <T = unknown>(url: string, data: unknown, timeout?: number) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data) }, timeout),
  put: <T = unknown>(url: string, data: unknown, timeout?: number) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(data) }, timeout),
  delete: <T = unknown>(url: string, timeout?: number) =>
    request<T>(url, { method: "DELETE" }, timeout),
};
