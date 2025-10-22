import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-3 shadow-none p-3 bg-light">
      <div className="container text-center ">
        <span className="fw-semibold" style={{ letterSpacing: "0.5px" }}>
          © {currentYear}{" "}
          <span className="fw-bold text-success">Task Master</span> &mdash; Tous
          droits réservés.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
