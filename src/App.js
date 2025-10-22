// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

// Récupération du token depuis la session (non persistant après fermeture navigateur)
const getToken = () => {
  let token = sessionStorage.getItem('userToken') || sessionStorage.getItem('token');
  return token;
};

function App() {
  const isAuthenticated = !!getToken();

  return (
    <Routes>
      {/* Toujours afficher la page d'accueil en "/" */}
      <Route path="/" element={<Home />} />
      {/* Protéger le dashboard */}
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
