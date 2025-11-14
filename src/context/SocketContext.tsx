import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "./socket";

interface SocketContextType {
  socket: Socket;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface Props {
  token: string; // JWT from your login
  clinicId: number;
  doctorId: number | null;
  children: React.ReactNode;
}

export const SocketProvider: React.FC<Props> = ({
  token,
  clinicId,
  doctorId,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const socket = getSocket(token);
  useEffect(() => {
    // connect if not connected
    if (!socket.connected) socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("✅   Socket connected:", socket.id);
      socket.emit("joinClinic", clinicId, doctorId);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      // Optional: don’t fully disconnect if other pages still use socket
      // socket.disconnect();
    };
  }, [socket, clinicId, doctorId]);

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
