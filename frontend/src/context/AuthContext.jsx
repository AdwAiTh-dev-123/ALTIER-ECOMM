import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import {
  register,
  login,
  getProfile,
  logout,
  googleLogin,
} from "../api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await getProfile();
        setUser(res.data.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async ({ email, password }) => {
    const res = await login({ email, password });
    setUser(res.data.user);
    return res.data;
  };

  const handleGoogleLogin = async ({ idToken }) => {
    const res = await googleLogin({ idToken });
    setUser(res.data.user);
    return res.data;
  };

  const handleRegister = async ({ email, password, name }) => {
    const res = await register({ email, password, name });
    setUser(res.data.user);
    return res.data;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        isAdmin: user?.role === "admin",
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        loginWithGoogle: handleGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
