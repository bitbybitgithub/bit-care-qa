// const BASE_URL = "http://devapi.emrproject.com/api"; 
const BASE_URL = "http://localhost:8989/api";

// -------------------- //
//  Interceptor Hooks
// -------------------- //

// These are optional callbacks you can define elsewhere in your app
type InterceptorHooks = {
  onRequestStart?: (url: string) => void;
  onRequestEnd?: (url: string) => void;
  onAuthError?: () => void;
};

const interceptors: InterceptorHooks = {};

// Allow setting global interceptors
export const ApiInterceptor = {
  set: (hooks: InterceptorHooks) => Object.assign(interceptors, hooks),
};

// -------------------- //
//   Header Builder
// -------------------- //

const getHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const token = localStorage.getItem("token") || "emr123user456token789";
  return {
    "Content-Type": "application/json",
    Authorization: token,
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

  return fetch(url, { ...options, signal: controller.signal ,   credentials: "include", }).finally(() =>
    clearTimeout(timer)
  );
};

// -------------------- //
//   Request Core
// -------------------- //

async function request<T = unknown>(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<T> {
  const fullUrl = `${BASE_URL}${url}`;

  interceptors.onRequestStart?.(fullUrl); // 👉 loader starts

  try {
    const response = await fetchWithTimeout(
      fullUrl,
      { ...options, headers: getHeaders(options.headers) },
      timeout
    );

    // Handle auth error globally
    if (response.status === 401) {
      interceptors.onAuthError?.();
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

    const data = (await response.json()) as T;
    return data;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    console.error("API error:", error);
    throw error;
  } finally {
    interceptors.onRequestEnd?.(fullUrl); // 👉 loader stops
  }
}

// -------------------- //
//   Unified API Object
// -------------------- //

export const emrAPI = {
  get: <T = unknown>(url: string, timeout?: number) =>
    request<T>(url, { method: "GET" }, timeout),
  post: <T = unknown>(url: string, data: unknown, timeout?: number) =>
    request<T>(
      url,
      { method: "POST", body: JSON.stringify(data) },
      timeout
    ),
  put: <T = unknown>(url: string, data: unknown, timeout?: number) =>
    request<T>(
      url,
      { method: "PUT", body: JSON.stringify(data) },
      timeout
    ),
  delete: <T = unknown>(url: string, timeout?: number) =>
    request<T>(url, { method: "DELETE" }, timeout),
};
