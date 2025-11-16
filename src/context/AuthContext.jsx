// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  const login = async (payload) => {
    const out = await authService.login(payload);
    if (out?.success && out?.data) {
      setUser(out.data); // contains token, role, (patientId|doctorId)
    }
    return out;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Optional: keep store in sync if user changes elsewhere
  useEffect(() => {
    const handler = () => setUser(authService.getCurrentUser());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
