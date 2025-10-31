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

// const SESSION_KEY = "user";

export function setSession(SESSION_KEY:string,data: SessionData): void {
  const existing = getSession(SESSION_KEY);
  const updated = { ...existing, ...data };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
}

export function getSession(SESSION_KEY:string): SessionData {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    console.error("Invalid session data — clearing");
    clearSession();
    return {
        
    };
  }
}

export function clearSession(SESSION_KEY:string): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionItem<T = any>(SESSION_KEY:string,key: keyof SessionData): T | null {
  const session = getSession(SESSION_KEY);
  return (session[key] as T) ?? null;
}

export function removeSessionItem(SESSION_KEY:string,key: keyof SessionData): void {
  const session = getSession(SESSION_KEY);
  delete session[key];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
