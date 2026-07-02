import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    if (currentUser && currentUser.token) {
      const newSocket = io(API_URL.replace("/api", ""), {
        query: { token: currentUser.token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to Real-time Infrastructure");
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      });
      newSocket.on("notification", (data) => {
        toast.success(data.title || "New System Alert", {
          icon: "🔔",
          duration: 5000,
        });
        window.dispatchEvent(new CustomEvent("new-notification", { detail: data }));
      });

      setSocket(newSocket);


      return () => {
        if (newSocket) newSocket.disconnect();
      };
    }
  }, []);


  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
