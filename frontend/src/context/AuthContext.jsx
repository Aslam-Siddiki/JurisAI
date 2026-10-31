import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jurisai_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Auth check failed:", err.message);
        localStorage.removeItem("jurisai_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("jurisai_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, role = "claimant", autoLogin = false) => {
    const res = await api.post("/auth/register", { name, email, password, role });
    if (autoLogin) {
      localStorage.setItem("jurisai_token", res.data.token);
      setUser(res.data.user);
    }
    return res.data;
  };

  const updateProfile = async (data) => {
    const res = await api.put("/auth/profile", data);
    setUser(res.data.user);
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put("/auth/password", { currentPassword, newPassword });
    localStorage.removeItem("jurisai_token");
    setUser(null);
    return res.data;
  };

  const deleteAccount = async () => {
    const res = await api.delete("/auth/account");
    logout();
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("jurisai_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
