import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Au chargement, lire le token depuis localStorage
    const token = localStorage.getItem("userToken");
    if (token) setUserToken(token);
  }, []);

  const login = (token) => {
    localStorage.setItem("userToken", token);
    setUserToken(token);
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
