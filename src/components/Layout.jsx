// src/components/Layout.jsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";


const Layout = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("userToken");
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="d-flex flex-grow-1" style={{ minHeight: 0, gap: 16 }}>
        {isAuthenticated && <Sidebar />}
        <main
          className="flex-grow-1"
          style={{
            padding: "20px",
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto'
          }}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
