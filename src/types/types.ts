// Redux Auth State
export interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Login Form Data
export interface LoginFormData {
  number: string;
  password: string;
}

// Error Handling
export interface ValidationErrors {
  number?: string;
  password?: string;
  email?: string;
  [key: string]: string | undefined; // flexible for future
}


// User / Patient Types
export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "doctor" | "patient" | "admin";
}


// Common API Response Type
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Regex Type
export interface RegexCollection {
  mobile: RegExp;
  password: RegExp;
  email: RegExp;
  [key: string]: RegExp; 
}
