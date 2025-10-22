// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

// Récupération robuste du token depuis le localStorage
const getToken = () => {
  let token = localStorage.getItem('userToken') || localStorage.getItem('token');
  if (!token) {
    try { token = JSON.parse(localStorage.getItem('userInfo') || '{}')?.token; } catch { /* noop */ }
  }
  return token;
};

function App() {
  const isAuthenticated = !!getToken();

  return (
    <Routes>
      {/* Afficher la Home uniquement si non connecté, sinon rediriger vers le dashboard */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} />
      {/* Protéger le dashboard si besoin; sinon laisser l'accès libre. Ici on protège. */}
      <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
