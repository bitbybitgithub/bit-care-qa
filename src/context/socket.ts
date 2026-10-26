import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../services/EmrApi";

export interface SocketAuthParams {
  token?: string | null;
  clinicId?: number | string | null;
  userId?: number | string | null;
  doctorId?: number | string | null;
  role?: string | null;
  labId?: number | string | null;
  pharmacyId?: number | string | null;
}

/**
 * Dynamically resolves the Socket Server URL:
 * 1. Checks VITE_SOCKET_URL / VITE_API_URL environment variables
 * 2. Derives from BASE_URL (stripping trailing /api)
 * 3. Falls back to http://localhost:8989
 */
export const getSocketUrl = (): string => {
  try {
    const env = import.meta as unknown as { env?: Record<string, string> };
    const envUrl = env.env?.VITE_SOCKET_URL || env.env?.VITE_API_URL;
    if (envUrl && typeof envUrl === "string") {
      return envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    }
  } catch {
    // ignore
  }

  if (BASE_URL && typeof BASE_URL === "string") {
    return BASE_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }

  return "http://localhost:8989";
};

let socket: Socket | null = null;
let currentAuth: SocketAuthParams = {};

/**
 * Normalizes auth parameters for the backend handshake middleware
 */
export const formatAuthPayload = (params: SocketAuthParams = {}) => {
  const token = params.token;
  const formattedToken = token
    ? token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`
    : undefined;

  return {
    token: formattedToken,
    clinicId:
      params.clinicId !== undefined && params.clinicId !== null && params.clinicId !== ""
        ? Number(params.clinicId)
        : undefined,
    userId:
      params.userId !== undefined && params.userId !== null && params.userId !== ""
        ? Number(params.userId)
        : undefined,
    doctorId:
      params.doctorId !== undefined && params.doctorId !== null && params.doctorId !== ""
        ? Number(params.doctorId)
        : undefined,
    role: params.role || undefined,
    labId:
      params.labId !== undefined && params.labId !== null && params.labId !== ""
        ? Number(params.labId)
        : undefined,
    pharmacyId:
      params.pharmacyId !== undefined && params.pharmacyId !== null && params.pharmacyId !== ""
        ? Number(params.pharmacyId)
        : undefined,
  };
};

/**
 * Initializes socket client with JWT and context auth
 */
export const initializeSocket = (params?: SocketAuthParams): Socket => {
  if (params) {
    currentAuth = { ...currentAuth, ...params };
  }

  const socketUrl = getSocketUrl();
  const authPayload = formatAuthPayload(currentAuth);

  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      auth: authPayload,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: false,
    });

    socket.on("connect", () => {
      console.log("⚡ Socket connected. ID:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔌 Socket disconnected:", reason);
    });
  } else {
    socket.auth = authPayload;
  }

  return socket;
};

/**
 * Returns existing socket instance or initializes one.
 * Compatible with getSocket(token?: string) and getSocket(params?: SocketAuthParams).
 */
export const getSocket = (tokenOrParams?: string | SocketAuthParams): Socket => {
  if (typeof tokenOrParams === "string") {
    currentAuth.token = tokenOrParams;
  } else if (tokenOrParams && typeof tokenOrParams === "object") {
    currentAuth = { ...currentAuth, ...tokenOrParams };
  }

  if (!socket) {
    return initializeSocket();
  }

  if (tokenOrParams) {
    socket.auth = formatAuthPayload(currentAuth);
  }

  return socket;
};

/**
 * Updates socket auth credentials and reconnects if active
 */
export const updateSocketAuth = (
  params: Partial<SocketAuthParams>,
  reconnectIfConnected = true
): void => {
  currentAuth = { ...currentAuth, ...params };
  if (socket) {
    socket.auth = formatAuthPayload(currentAuth);
    if (reconnectIfConnected && socket.connected) {
      socket.disconnect().connect();
    }
  }
};

/**
 * Cleanly disconnects the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    try {
      socket.disconnect();
    } catch (err) {
      console.warn("Error disconnecting socket:", err);
    }
    socket = null;
  }
};
