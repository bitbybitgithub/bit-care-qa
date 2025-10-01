const BASE_URL = "http://devapi.emrproject.com/api"; 
// const BASE_URL = "http://localhost:5000/api";

const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: "emr123user456token789",
};

async function request<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || `HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

export const EmrApi = {
  get: <T = unknown>(url: string) => request<T>(url, { method: "GET" }),
  post: <T = unknown>(url: string, data: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: <T = unknown>(url: string, data: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: <T = unknown>(url: string) => request<T>(url, { method: "DELETE" }),
};
