// src/utils/session.ts
// A simple, type-safe wrapper around sessionStorage

export interface SessionData {
 user_id: number;
  clinic_id: number; 
  doctor_id?: number; 
  full_name: string;
  email: string;
  phone: string;
  is_active:string;
  role: string;
  clinic_name:string;
  is_temp_password:string;
  [key: string]: any; // allow additional keys if needed
}

const SESSION_KEY = "user";

export function setSession(data: SessionData): void {
  const existing = getSession();
  const updated = { ...existing, ...data };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
}

export function getSession(): SessionData {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    console.error("Invalid session data — clearing");
    clearSession();
    return {};
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionItem<T = any>(key: keyof SessionData): T | null {
  const session = getSession();
  return (session[key] as T) ?? null;
}

export function removeSessionItem(key: keyof SessionData): void {
  const session = getSession();
  delete session[key];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
