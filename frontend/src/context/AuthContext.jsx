import React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
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
  const [blockedToast, setBlockedToast] = useState(null);

  useEffect(() => {
    const handleBlocked = (e) => {
      setUser(null);
      setBlockedToast(
        e.detail?.message ||
          "Account access has been restricted by administrator",
      );
    };
    window.addEventListener("auth:user_blocked", handleBlocked);
    return () => window.removeEventListener("auth:user_blocked", handleBlocked);
  }, []);
  useEffect(() => {
    if (!blockedToast) return;
    const timer = setTimeout(() => setBlockedToast(null), 6000);
    return () => clearTimeout(timer);
  }, [blockedToast]);

  const checkSession = useCallback(async () => {
    try {
      const res = await getProfile();
      setUser(res.data.data);
      return res.data.data;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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

  const handleRegister = async ({ email, password, name, otp }) => {
    const res = await register({ email, password, name, otp });
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
        checkSession,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        loginWithGoogle: handleGoogleLogin,
      }}
    >
      {children}

      {/* Floating warning toast shown instantly upon being blocked */}
      {blockedToast && (
        <div className="cart-floating-toast error">⚠️ {blockedToast}</div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
