import React from "react";
import Layout from "../components/Layout";

const Home = () => (
  <Layout>
    {/* Background bleu clair-blanc apaisant sur toute la page */}
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{
        zIndex: -1,
        background:
          "linear-gradient(135deg, #e3f0ff 0%, #b1d9f5 60%, #ffffff 100%)",
        minHeight: "100vh",
      }}
    />
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow-lg px-4 py-5 text-center"
        style={{
          maxWidth: 500,
          width: "100%",
          border: "none",
          borderRadius: "2rem",
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 8px 32px rgba(35,41,70,0.10)",
        }}
      >
        <div className="mb-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3176/3176363.png"
            alt="To Do Illustration"
            style={{
              width: 90,
              marginBottom: 10,
              filter: "drop-shadow(0 4px 16px #b1d9f540)",
            }}
          />
        </div>
        <h1
          className="mb-3 fw-bold"
          style={{
            color: "#232946",
            letterSpacing: "1px",
            fontSize: "2.2rem",
          }}
        >
          Bienvenue sur <span style={{ color: "#0d6efd" }}>Task Master</span>
        </h1>
        <p className="lead mb-4" style={{ color: "#232946", fontWeight: 500 }}>
          Organisez, planifiez et accomplissez vos tâches avec style.
          <br />
          <span style={{ color: "#0d6efd", fontWeight: 600 }}>
            Simple. Moderne. Efficace.
          </span>
        </p>
        <a
          href="/register"
          className="btn btn-primary btn-lg w-100 shadow"
          style={{
            fontWeight: 700,
            fontSize: "1.18rem",
            letterSpacing: "0.5px",
            borderRadius: "2rem",
            color: "#fff",
            border: "none",
            boxShadow: "0 2px 12px #b1d9f540",
            transition: "background 0.2s, box-shadow 0.2s",
          }}
        >
          Commencer maintenant
        </a>
      </div>
    </div>
  </Layout>
);

export default Home;
