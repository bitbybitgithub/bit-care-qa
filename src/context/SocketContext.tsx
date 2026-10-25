import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "./socket";

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface Props {
  token: string;
  clinicId?: number | null;
  doctorId?: number | null;
  labId?: number | null;
  children: React.ReactNode;
}

export const SocketProvider: React.FC<Props> = ({
  token,
  clinicId,
  doctorId,
  labId,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socket = getSocket(token);

  useEffect(() => {
    if (token) {
      socket.auth = { token };
    }

    const emitJoins = () => {
      if (clinicId) {
        socket.emit(
          "joinClinic",
          Number(clinicId),
          doctorId ? Number(doctorId) : null,
        );
      }
      if (labId) {
        socket.emit("joinLab", Number(labId));
      }
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
      emitJoins();
    }

    const handleConnect = () => {
      setIsConnected(true);
      emitJoins();
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      setIsConnected(false);
      console.warn("⚠️ Socket disconnected:", reason);
    };

    const handleConnectError = (err: Error) => {
      console.warn("Socket connect error:", err.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, clinicId, doctorId, labId, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
