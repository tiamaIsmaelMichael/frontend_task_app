import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { uploadAvatar, updateProfile, BACKEND_ORIGIN } from "../services/api";
import { ThemeContext } from "../context/ThemeContext";
import { listNotifications } from "../services/api";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const { theme, setTheme, themes } = useContext(ThemeContext);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("userInfo"));
      setUser(u || null);
      if (u) {
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        const avatar = u.avatarUrl
          ? (/^https?:\/\//i.test(u.avatarUrl) ? u.avatarUrl : `${BACKEND_ORIGIN}${u.avatarUrl}`)
          : "";
        setPreview(avatar);
        setAvatarUrl(u.avatarUrl || "");
      }
      // premier chargement du compteur si admin
      (async () => {
        try {
          if (u?.role === 'admin') {
            const items = await listNotifications();
            setUnread(items.filter(it => !it.read).length);
          } else {
            setUnread(0);
          }
        } catch {
          setUnread(0);
        }
      })();
    } catch {
      setUser(null);
      setUnread(0);
    }
  }, []);

  // Polling périodique pour actualiser dynamiquement le badge admin
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    let cancelled = false;
    const tick = async () => {
      try {
        const items = await listNotifications();
        if (!cancelled) setUnread(items.filter(it => !it.read).length);
      } catch {
        if (!cancelled) setUnread(0);
      }
    };
    const id = setInterval(tick, 30000); // 30s
    // lancer un tick immédiat à l'ouverture
    tick();
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.role]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  const onFileChange = async (e) => {
    try {
      setError("");
      const file = e.target.files?.[0];
      if (!file) return;
      const { url } = await uploadAvatar(file);
      setAvatarUrl(url);
      setPreview(/^https?:\/\//i.test(url) ? url : `${BACKEND_ORIGIN}${url}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Erreur lors de l'upload.";
      setError(msg);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await updateProfile({ firstName, lastName, avatarUrl });
      localStorage.setItem("userInfo", JSON.stringify(updated));
      setUser(updated);
      // Refresh preview if avatar changed
      const newPreview = updated.avatarUrl
        ? (/^https?:\/\//i.test(updated.avatarUrl) ? updated.avatarUrl : `${BACKEND_ORIGIN}${updated.avatarUrl}`)
        : "";
      setPreview(newPreview);
      setShowModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Erreur lors de la sauvegarde.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`sidebar${isOpen ? " open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="content">
        {user ? (
          <>
            <div className="d-flex flex-column align-items-center">
              {preview ? (
                <img
                  src={preview}
                  alt={`Avatar de ${user.firstName} ${user.lastName}`}
                  className="avatar mb-2"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.firstName + " " + user.lastName
                  )}&background=198754&color=fff&size=128`}
                  alt={`Avatar de ${user.firstName} ${user.lastName}`}
                  className="avatar mb-2"
                />
              )}
              <div className="username">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-white-50 small mb-2">{user.email}</div>
              <button className="btn btn-sm btn-outline-light" onClick={() => setShowModal(true)}>
                Modifier mon profil
              </button>
            </div>
            <div className="divider"></div>
            {/* Section Thème */}
            <div className="mb-2 w-100 px-2">
              <label className="form-label text-white">Thème</label>
              <select className="form-select form-select-sm" value={theme} onChange={(e) => setTheme(e.target.value)}>
                {themes?.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="divider"></div>
            {user.role === 'admin' && (
              <>
                <div className="d-flex flex-column align-items-center w-100 mb-2">
                  <button className="btn btn-sm btn-warning w-100 admin-btn" onClick={() => navigate('/admin')}>
                    <i className="bi bi-shield-lock me-2"></i>Admin {unread > 0 && <span className="badge bg-danger ms-2">{unread}</span>}
                  </button>
                </div>
                <div className="divider"></div>
              </>
            )}
            {/* Bouton de déconnexion en dernier */}
            <button className="logout-btn mb-2" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>Se déconnecter
            </button>
            {showModal && (
              <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Éditer mon profil</h5>
                      <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                    </div>
                    <div className="modal-body">
                      {error && <div className="alert alert-danger">{error}</div>}
                      <div className="mb-3">
                        <label className="form-label">Avatar</label>
                        <input type="file" accept="image/*" className="form-control" onChange={onFileChange} />
                        {preview && <img src={preview} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginTop: 8 }} />}
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Prénom</label>
                        <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Nom</label>
                        <input className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                      <button className="btn btn-primary" onClick={onSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center h-100">
            <span className="text-white-50">Non connecté</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
