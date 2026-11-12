import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, login as apiLogin, logout as apiLogout, fetchCsrfToken, resetCurrentUserRequest } from "../api/auth";
import { resetTicketRequests } from "../api/tickets";

const AuthContext = createContext(null);
let authGeneration = 0;

export const useAuth = () => useContext(AuthContext);

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generation = authGeneration;
    let active = true;
    fetchCurrentUser()
      .then((data) => {
        if (active && generation === authGeneration) setUser(data);
      })
      .catch(() => {
        if (active && generation === authGeneration) setUser(null);
      })
      .finally(() => {
        if (active && generation === authGeneration) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email, password) => {
    authGeneration += 1;
    resetCurrentUserRequest();
    resetTicketRequests();
    const data = await apiLogin(email, password);
    setUser(data);
    return data;
  };

  const signOut = async () => {
    authGeneration += 1;
    resetCurrentUserRequest();
    resetTicketRequests();
    const csrfToken = readCookie("libra3d_csrf");
    try {
      await apiLogout(csrfToken);
    } finally {
      setUser(null);
    }
  };

  const ensureCsrfToken = async () => {
    if (readCookie("libra3d_csrf")) return readCookie("libra3d_csrf");
    const token = await fetchCsrfToken();
    return token;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, ensureCsrfToken }}>
      {children}
    </AuthContext.Provider>
  );
};
