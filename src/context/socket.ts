import { io, Socket } from "socket.io-client";

const SOCKET_URL ="http://localhost:8989";
//const SOCKET_URL ="https://cliniccareapi.bitbybitsolutions.co.in";

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,        // we’ll manually connect after setting auth
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }

  // Update token before connecting (important if user logs in/out)
  if (token) {
    socket.auth = { token };
  }

  return socket;
};
