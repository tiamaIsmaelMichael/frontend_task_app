import React, { useState } from "react";
import api from "../services/api"; // ← assure-toi que le chemin est correct
import { Link, useNavigate } from "react-router-dom"; // ✅

const Register = () => {
  const navigate = useNavigate(); // ✅

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    try {
      await api.post("/users/register", formData);
      setSuccess("Inscription réussie !");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // ✅ Redirection après 1 seconde (optionnel, pour voir le message de succès)
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription.");
    }
  };

  return (
    <div className="container-fluid container-md d-flex justify-content-center align-items-center min-vh-100 px-3">
      <div 
        className="card shadow-lg border-0" 
        style={{ 
          maxWidth: "450px", 
          width: "100%",
          borderRadius: "1.2rem",
          background: "rgba(255, 255, 255, 0.98)"
        }}
      >
        <div className="card-body p-4 p-md-5">
          <h2 className="text-center mb-4 fw-bold" style={{ color: "#232946" }}>
            Inscription
          </h2>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">Prénom</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="form-control form-control-lg"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">Nom</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="form-control form-control-lg"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control form-control-lg"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">Mot de passe</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="form-control form-control-lg"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control form-control-lg"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg w-100"
                  style={{
                    borderRadius: "0.8rem",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}
                >
                  S'inscrire
                </button>
              </div>
            </div>
          </form>

          <p className="mt-4 text-center mb-0">
            Déjà inscrit ?{" "}
            <Link 
              to="/login" 
              className="text-decoration-none fw-semibold"
              style={{ color: "#0d6efd" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
