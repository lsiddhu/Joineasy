import { createContext, useContext, useEffect, useState } from "react";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const login = (profile, jwt) => {
    localStorage.setItem("user", JSON.stringify(profile));
    localStorage.setItem("token", jwt);
    setUser(profile);
    setToken(jwt);
  };
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };
  useEffect(() => {
    const fn = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("joineazy:unauthorized", fn);
    return () => window.removeEventListener("joineazy:unauthorized", fn);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
