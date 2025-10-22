// src/pages/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api"; // axios configuré avec baseURL

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/users/login", { email, password });

      // Stocker token + infos utilisateur en session (non persistant)
      const { token, user } = res.data || {};
      // Nettoyer d'éventuels anciens tokens persistants
      try { localStorage.removeItem("userToken"); localStorage.removeItem("token"); localStorage.removeItem("userInfo"); } catch {}
      if (token) {
        sessionStorage.setItem("userToken", token);
        sessionStorage.setItem("token", token);
      }
      if (user) {
        const enriched = { ...user, token };
        sessionStorage.setItem("userInfo", JSON.stringify(enriched));
      }

      // Informer l'application que l'état d'auth a changé
      try { window.dispatchEvent(new Event('auth-changed')); } catch {}

      if (!token) {
        setError("Réponse de connexion invalide: aucun token reçu.");
        return;
      }
      // Forcer une navigation dure pour éviter tout état obsolète du routeur
      window.location.replace("/dashboard");
    } catch (err) {
      // Gestion des erreurs API
      setError(
        err.response?.data?.message ||
          "Erreur lors de la connexion. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid container-md d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div 
        className="card shadow-lg border-0" 
        style={{ 
          maxWidth: "400px", 
          width: "100%",
          borderRadius: "1.2rem",
          background: "rgba(255, 255, 255, 0.98)"
        }}
      >
        <div className="card-body p-4 p-md-5">
          <h2 className="text-center mb-4 fw-bold" style={{ color: "#232946" }}>Connexion</h2>
          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-control form-control-lg"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="form-control form-control-lg"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mb-3"
              disabled={loading}
              style={{
                borderRadius: "0.8rem",
                fontSize: "1.1rem",
                fontWeight: "600"
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          <p className="mt-4 text-center mb-0">
            Vous n'avez pas de compte ?{" "}
            <Link 
              to="/register" 
              className="text-decoration-none fw-semibold"
              style={{ color: "#0d6efd" }}
            >
              Inscrivez-vous ici
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
