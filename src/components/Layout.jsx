// src/components/Layout.jsx
import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";


const Layout = ({ children }) => {
  const isAuthenticated = !!sessionStorage.getItem("userToken");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fabHidden, setFabHidden] = useState(false);

  // Close mobile sidebar on route/content scroll and on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia && !window.matchMedia('(max-width: 576px)').matches) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide/show floating button while scrolling
  useEffect(() => {
    let timer;
    const onScroll = () => {
      setFabHidden(true);
      clearTimeout(timer);
      timer = setTimeout(() => setFabHidden(false), 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="d-flex flex-grow-1" style={{ minHeight: 0, gap: 16 }}>
        {isAuthenticated && (
          <Sidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
        )}
        {isAuthenticated && mobileOpen && (
          <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
        )}
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
      {isAuthenticated && (
        <button
          type="button"
          className={`sidebar-toggle-btn ${fabHidden ? 'hidden' : ''}`}
          aria-label="Menu"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? '×' : '≡'}
        </button>
      )}
      <Footer />
    </div>
  );
};

export default Layout;
