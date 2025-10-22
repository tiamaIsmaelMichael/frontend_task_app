import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { listNotifications, markNotificationRead } from '../services/api';

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | unread | read
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur chargement notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [filter, typeFilter, items.length]);

  const types = useMemo(() => {
    const t = new Set();
    items.forEach((n) => { if (n.type) t.add(n.type); });
    return Array.from(t);
  }, [items]);

  const filtered = items.filter((n) => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'read' && !n.read) return false;
    if (typeFilter && n.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const onMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur de mise à jour');
    }
  };

  const onMarkAllRead = async () => {
    try {
      const unread = items.filter((n) => !n.read);
      for (const n of unread) {
        await markNotificationRead(n._id);
      }
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur de mise à jour');
    }
  };

  return (
    <Layout>
      <div className="container py-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Mes notifications</h3>
          <button className="btn btn-sm btn-outline-secondary" onClick={onMarkAllRead} disabled={items.every((n) => n.read)}>Tout marquer comme lu</button>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <div className="btn-group" role="group">
              <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setFilter('all')}>Toutes</button>
              <button className={`btn btn-sm ${filter==='unread'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setFilter('unread')}>Non lues</button>
              <button className={`btn btn-sm ${filter==='read'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setFilter('read')}>Lues</button>
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <select className="form-select form-select-sm d-inline-block w-auto" value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)}>
              <option value="">Tous types</option>
              {types.map((t)=> (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <div className="card">
            <div className="list-group list-group-flush">
              {pageItems.length === 0 ? (
                <div className="list-group-item text-muted">Aucune notification</div>
              ) : (
                pageItems.map((n) => (
                  <div key={n._id} className={`list-group-item ${n.read ? '' : 'bg-light'}`}>
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <div className="fw-semibold">{n.title}</div>
                        <div className="small text-muted">{n.message}</div>
                        <div className="small text-secondary">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {!n.read && <button className="btn btn-sm btn-outline-primary" onClick={()=>onMarkRead(n._id)}>Marquer comme lue</button>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted">Page {page} / {totalPages} — {filtered.length} éléments</div>
          <div className="btn-group">
            <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Précédent</button>
            <button className="btn btn-outline-secondary btn-sm" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Suivant</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
