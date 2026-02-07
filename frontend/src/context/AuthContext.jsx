import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config";

const AuthContext = createContext(null);

const TOKEN_KEY = "crypto_delivery_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setTokenState(newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTokenState(t);
      } else {
        setToken(null);
      }
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, fullName, phone, address) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phone, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => setToken(null);

  const linkWallet = async (walletAddress) => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ walletAddress }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  const setRole = async (role, extra = {}) => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t || (role !== "customer" && role !== "courier")) return;
    const body = { role };
    if (extra.carInfo !== undefined) body.carInfo = extra.carInfo;
    if (extra.carPlate !== undefined) body.carPlate = extra.carPlate;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };

  const updateProfile = async (data) => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const body = {};
    if (data.fullName !== undefined) body.fullName = data.fullName;
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.address !== undefined) body.address = data.address;
    if (data.carInfo !== undefined) body.carInfo = data.carInfo;
    if (data.carPlate !== undefined) body.carPlate = data.carPlate;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      setUser(json.user);
    }
    return res.ok;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    linkWallet,
    setRole,
    updateProfile,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
