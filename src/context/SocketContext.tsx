/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Socket } from "socket.io-client";
import {
  initializeSocket,
  getSocket,
} from "./socket";

export interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
  joinClinic: (clinicId: number | string, doctorId?: number | string | null) => void;
  leaveClinic: (clinicId: number | string) => void;
  joinDoctor: (doctorId: number | string) => void;
  leaveDoctor: (doctorId: number | string) => void;
  joinLab: (labId: number | string) => void;
  leaveLab: (labId: number | string) => void;
  joinPharma: (pharmacyId: number | string) => void;
  leavePharma: (pharmacyId: number | string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export interface Props {
  token?: string | null;
  clinicId?: number | string | null;
  doctorId?: number | string | null;
  userId?: number | string | null;
  role?: string | null;
  labId?: number | string | null;
  pharmacyId?: number | string | null;
  children: React.ReactNode;
}

export const SocketProvider: React.FC<Props> = ({
  token,
  clinicId,
  doctorId,
  userId,
  role,
  labId,
  pharmacyId,
  children,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socket = getSocket({
    token,
    clinicId,
    doctorId,
    userId,
    role,
    labId,
    pharmacyId,
  });

  const prevClinicIdRef = useRef<number | string | null | undefined>(null);
  const prevDoctorIdRef = useRef<number | string | null | undefined>(null);
  const prevLabIdRef = useRef<number | string | null | undefined>(null);
  const prevPharmaIdRef = useRef<number | string | null | undefined>(null);

  /* Helper methods for components to explicitly join/leave rooms */
  const joinClinic = useCallback((cId: number | string, dId?: number | string | null) => {
    if (socket && cId) {
      socket.emit("joinClinic", {
        clinicId: Number(cId),
        doctorId: dId ? Number(dId) : undefined,
      });
    }
  }, [socket]);

  const leaveClinic = useCallback((cId: number | string) => {
    if (socket && cId) {
      socket.emit("leaveClinic", { clinicId: Number(cId) });
    }
  }, [socket]);

  const joinDoctor = useCallback((dId: number | string) => {
    if (socket && dId) {
      socket.emit("joinDoctor", { doctorId: Number(dId) });
    }
  }, [socket]);

  const leaveDoctor = useCallback((dId: number | string) => {
    if (socket && dId) {
      socket.emit("leaveDoctor", { doctorId: Number(dId) });
    }
  }, [socket]);

  const joinLab = useCallback((lId: number | string) => {
    if (socket && lId) {
      socket.emit("joinLab", { labId: Number(lId) });
    }
  }, [socket]);

  const leaveLab = useCallback((lId: number | string) => {
    if (socket && lId) {
      socket.emit("leaveLab", { labId: Number(lId) });
    }
  }, [socket]);

  const joinPharma = useCallback((pId: number | string) => {
    if (socket && pId) {
      socket.emit("joinPharma", { pharmacyId: Number(pId) });
    }
  }, [socket]);

  const leavePharma = useCallback((pId: number | string) => {
    if (socket && pId) {
      socket.emit("leavePharma", { pharmacyId: Number(pId) });
    }
  }, [socket]);

  useEffect(() => {
    // Ensure socket auth is refreshed
    initializeSocket({
      token,
      clinicId,
      doctorId,
      userId,
      role,
      labId,
      pharmacyId,
    });

    const emitJoins = () => {
      if (clinicId) {
        socket.emit("joinClinic", {
          clinicId: Number(clinicId),
          doctorId: doctorId ? Number(doctorId) : undefined,
        });
      }
      if (doctorId) {
        socket.emit("joinDoctor", { doctorId: Number(doctorId) });
      }
      if (labId) {
        socket.emit("joinLab", { labId: Number(labId) });
      }
      if (pharmacyId) {
        socket.emit("joinPharma", { pharmacyId: Number(pharmacyId) });
      }
    };

    const handleConnect = () => {
      setIsConnected(true);
      emitJoins();
    };

    const handleDisconnect = (reason: Socket.DisconnectReason | string) => {
      setIsConnected(false);
      console.warn("🔌 Socket disconnected:", reason);
    };

    const handleConnectError = (err: Error) => {
      setIsConnected(false);
      console.error("❌ Socket connect error:", err.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // If already connected, handle room transitions dynamically
    if (socket.connected) {
      setIsConnected(true);

      // Handle clinic change
      if (prevClinicIdRef.current && prevClinicIdRef.current !== clinicId) {
        socket.emit("leaveClinic", { clinicId: Number(prevClinicIdRef.current) });
      }
      if (clinicId) {
        socket.emit("joinClinic", {
          clinicId: Number(clinicId),
          doctorId: doctorId ? Number(doctorId) : undefined,
        });
      }

      // Handle doctor change
      if (prevDoctorIdRef.current && prevDoctorIdRef.current !== doctorId) {
        socket.emit("leaveDoctor", { doctorId: Number(prevDoctorIdRef.current) });
      }
      if (doctorId) {
        socket.emit("joinDoctor", { doctorId: Number(doctorId) });
      }

      // Handle lab change
      if (prevLabIdRef.current && prevLabIdRef.current !== labId) {
        socket.emit("leaveLab", { labId: Number(prevLabIdRef.current) });
      }
      if (labId) {
        socket.emit("joinLab", { labId: Number(labId) });
      }

      // Handle pharma change
      if (prevPharmaIdRef.current && prevPharmaIdRef.current !== pharmacyId) {
        socket.emit("leavePharma", { pharmacyId: Number(prevPharmaIdRef.current) });
      }
      if (pharmacyId) {
        socket.emit("joinPharma", { pharmacyId: Number(pharmacyId) });
      }
    } else {
      socket.connect();
    }

    prevClinicIdRef.current = clinicId;
    prevDoctorIdRef.current = doctorId;
    prevLabIdRef.current = labId;
    prevPharmaIdRef.current = pharmacyId;

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, token, clinicId, doctorId, userId, role, labId, pharmacyId]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinClinic,
        leaveClinic,
        joinDoctor,
        leaveDoctor,
        joinLab,
        leaveLab,
        joinPharma,
        leavePharma,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
