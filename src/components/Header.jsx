import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listNotifications, markNotificationRead, deleteNotification, deleteAllNotifications } from "../services/api";

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("userToken"));
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);
  const prevUnreadIdsRef = useRef(new Set());
  const [toast, setToast] = useState({ show: false, type: 'info', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const loadNotifications = useCallback(async () => {
    try {
      if (!isAuthenticated) return;
      const data = await listNotifications();
      const list = Array.isArray(data) ? data.slice(0, 20) : [];

      // Détecter les nouvelles non lues par rapport au précédent état
      const newUnreadIds = new Set(list.filter(n => !n.read).map(n => String(n._id)));
      const prevUnreadIds = prevUnreadIdsRef.current;
      let hasNew = false;
      for (const id of newUnreadIds) {
        if (!prevUnreadIds.has(id)) { hasNew = true; break; }
      }
      // Mettre à jour la ref pour la prochaine itération
      prevUnreadIdsRef.current = newUnreadIds;

      setNotifications(list);
      if (hasNew) {
        showToast('info', 'Nouvelle notification reçue');
      }
    } catch (e) {
      // ignore erreurs réseau ponctuelles
      setNotifications([]);
      prevUnreadIdsRef.current = new Set();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const t = setInterval(loadNotifications, 30000); // refresh toutes les 30s
      return () => clearInterval(t);
    }
  }, [isAuthenticated, loadNotifications]);

  // Suivre les changements d'auth dans la session (ex: login/logout)
  useEffect(() => {
    const onChange = () => setIsAuthenticated(!!sessionStorage.getItem('userToken'));
    window.addEventListener('storage', onChange);
    window.addEventListener('auth-changed', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('auth-changed', onChange);
    };
  }, []);

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, read: true } : n));
      // mettre à jour la ref
      prevUnreadIdsRef.current.delete(String(id));
    } catch {}
  };

  const onDeleteOne = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter(n => n._id !== id));
      // mettre à jour la ref (au cas où c'était une non lue)
      const s = new Set(prevUnreadIdsRef.current);
      s.delete(String(id));
      prevUnreadIdsRef.current = s;
      showToast('success', 'La notification a été supprimée.');
    } catch {}
  };

  const onMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await markNotificationRead(n._id);
      }
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      prevUnreadIdsRef.current = new Set();
      showToast('success', 'Toutes les notifications ont été marquées comme lues.');
    } catch {}
  };

  const onDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      prevUnreadIdsRef.current = new Set();
      showToast('success', 'Toutes les notifications ont été supprimées.');
    } catch {}
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-3">
      {/* Toast notifications */}
      {toast.show && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000, minWidth: 280 }}>
          <div className={`alert alert-${toast.type} alert-dismissible fade show shadow`} role="alert">
            {toast.message}
            <button type="button" className="btn-close" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="navbar-brand shadow-sm p-2 rounded btn btn-link text-decoration-none"
        style={{ backgroundColor: "#fff", cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        My To Do App
      </button>
      {!isAuthenticated ? (
        <div className="ms-auto">
          <a href="/login" className="btn btn-outline-primary me-2">
            Connexion
          </a>
          <a href="/register" className="btn btn-primary">
            Inscription
          </a>
        </div>
      ) : (
        <div className="ms-auto d-flex align-items-center" ref={bellRef}>
          <div className="position-relative me-3">
            <button className="btn btn-light position-relative" onClick={() => setOpen(o => !o)} aria-label="Notifications">
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount}
                  <span className="visually-hidden">non lues</span>
                </span>
              )}
            </button>
            {open && (
              <div className="dropdown-menu dropdown-menu-end show" style={{ minWidth: 320, maxWidth: 420, right: 0 }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                  <strong>Notifications</strong>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-secondary" onClick={onMarkAllRead} disabled={unreadCount === 0}>Tout marquer lu</button>
                    <button className="btn btn-outline-danger" onClick={onDeleteAll} disabled={notifications.length === 0}>Tout supprimer</button>
                  </div>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-3 text-muted">Aucune notification</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`px-3 py-2 border-bottom ${n.read ? '' : 'bg-light'}`}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold small">{n.title}</div>
                            <div className="small text-muted">{n.message}</div>
                            <div className="small text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {!n.read && (
                              <button className="btn btn-sm btn-link" onClick={() => onMarkRead(n._id)}>Marquer lu</button>
                            )}
                            <button className="btn btn-sm btn-link text-danger" onClick={() => onDeleteOne(n._id)} title="Supprimer">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
