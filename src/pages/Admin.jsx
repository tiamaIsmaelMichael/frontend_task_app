import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { adminListUsers, adminDeleteUser, adminResetPassword, adminCreateProject, adminListProjects, adminDeleteProject, adminTeamStats, adminUpdateProjectMembers, adminListAllTasks, adminReviewProgress, adminAssignTask, listNotifications, markNotificationRead, deleteNotification, deleteAllNotifications, adminCreateProjectTask } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Guard = ({ children }) => {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; }
  }, []);
  if (!user || user.role !== 'admin') {
    return <div className="container py-4">Accès refusé</div>;
  }
  return children;
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [editProject, setEditProject] = useState(null);
  const [review, setReview] = useState({ open: false, task: null, report: null, progress: '', comment: '', mode: 'approved' });
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // Etats du formulaire de création de tâche projet
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskProject, setTaskProject] = useState('');
  const [taskMembers, setTaskMembers] = useState([]);
  const [taskFiles, setTaskFiles] = useState([]);
  const [creatingTask, setCreatingTask] = useState(false);

  // Mapping id -> "Prénom Nom"
  const userNameById = useMemo(() => {
    const m = new Map();
    for (const u of users) {
      m.set(String(u._id), `${u.firstName || ''} ${u.lastName || ''}`.trim());
    }
    return m;
  }, [users]);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, p, s, t, n] = await Promise.all([
        adminListUsers(),
        adminListProjects(),
        adminTeamStats(),
        adminListAllTasks(),
        listNotifications(),
      ]);
      setUsers(u);
      setProjects(p);
      setStats(s);
      setAllTasks(t);
      setNotifications(n);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Erreur chargement admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskDue('');
    setTaskPriority('medium');
    setTaskProject('');
    setTaskMembers([]);
    setTaskFiles([]);
  };

  const onCreateProjectTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskProject) {
      showToast('danger', 'Veuillez renseigner le titre et le projet.');
      return;
    }
    try {
      setCreatingTask(true);
      await adminCreateProjectTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        dueDate: taskDue || undefined,
        priority: taskPriority,
        projectId: taskProject,
        assignedTo: taskMembers,
        files: Array.from(taskFiles || [])
      });
      showToast('success', 'Tâche créée avec succès.');
      resetTaskForm();
      await loadAll();
    } catch (e) {
      showToast('danger', e?.response?.data?.message || 'Erreur lors de la création de la tâche.');
    } finally {
      setCreatingTask(false);
    }
  };

  const onCreateProject = async (e) => {
    e.preventDefault();
    try {
      await adminCreateProject({ name: projName, description: projDesc, members: selectedMembers, maxMembers, startDate: projStart || undefined, endDate: projEnd || undefined });
      setProjName('');
      setProjDesc('');
      setSelectedMembers([]);
      setMaxMembers(10);
      setProjStart('');
      setProjEnd('');
      await loadAll();
    } catch (e) {
      setError(e?.response?.data?.message || 'Erreur création projet');
    }
  };

  const onDeleteProject = async (id) => { await adminDeleteProject(id); await loadAll(); };
  const onDeleteUser = async (id) => { await adminDeleteUser(id); await loadAll(); };
  const onResetPwd = async (id) => {
    const np = prompt('Nouveau mot de passe (min 6):');
    if (!np) return;
    await adminResetPassword(id, np);
    alert('Mot de passe réinitialisé');
  };

  const openReview = (task, report) => {
    const initial = typeof task?.progress === 'number' ? String(task.progress) : '';
    setReview({ open: true, task, report, progress: initial, comment: '', mode: 'approved' });
  };
  const closeReview = () => setReview({ open: false, task: null, report: null, progress: '', comment: '', mode: 'approved' });
  const confirmReview = async () => {
    if (!review.task || !review.report) return;
    if (review.mode === 'rejected') {
      const c = String(review.comment || '').trim();
      if (!c) {
        showToast('danger', 'Un commentaire est requis pour refuser un compte-rendu.');
        return;
      }
      try {
        await adminReviewProgress(review.task._id, review.report._id, 'rejected', c);
        showToast('success', 'Compte-rendu refusé avec succès.');
      } catch (e) {
        showToast('danger', e?.response?.data?.message || 'Erreur lors du refus.');
      }
    } else {
      let pct = undefined;
      if (review.progress !== '') {
        const n = Number(review.progress);
        if (!Number.isNaN(n)) pct = Math.max(0, Math.min(100, Math.round(n)));
      }
      try {
        await adminReviewProgress(review.task._id, review.report._id, 'approved', review.comment || '', pct);
        showToast('success', 'Avancement approuvé et progression mise à jour.');
      } catch (e) {
        showToast('danger', e?.response?.data?.message || 'Erreur lors de l\'approbation.');
      }
    }
    closeReview();
    await loadAll();
  };

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    // auto-hide après 3s
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  return (
    <Layout>
      <div className="container py-3">
        <h2 className="mb-3">Administration</h2>
        <div className="mb-3 d-flex justify-content-end">
          <button className="btn btn-outline-primary" onClick={() => navigate('/dashboard')}>Retour à l'espace utilisateur</button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading && <div>Chargement...</div>}

        {stats && (
          <div className="row g-3 mb-3">
            <div className="col-md-3"><div className="card p-3"><div>Total</div><h4>{stats.total}</h4></div></div>
            <div className="col-md-3"><div className="card p-3"><div>Terminées</div><h4>{stats.completed}</h4></div></div>
            <div className="col-md-3"><div className="card p-3"><div>Validées</div><h4>{stats.validated}</h4></div></div>
            <div className="col-md-3"><div className="card p-3"><div>Taux (%)</div><h4>{stats.completionRate}</h4></div></div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card p-3">
              <h5 className="card-title mb-3">Utilisateurs</h5>
              <ul className="list-group">
                {users.map(u => (
                  <li key={u._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{u.firstName} {u.lastName} {u.role === 'admin' && <span className="badge bg-primary ms-2">admin</span>}</div>
                      <div className="text-muted small">{u.email}</div>
                    </div>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => onResetPwd(u._id)}>Reset MDP</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDeleteUser(u._id)}>Supprimer</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card p-3 mb-3">
              <h5 className="card-title mb-3">Créer un projet</h5>
              <form onSubmit={onCreateProject}>
                <div className="mb-2">
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={projName} onChange={(e) => setProjName(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                </div>
                <div className="row g-2">
                  <div className="col">
                    <label className="form-label">Début du projet</label>
                    <input type="date" className="form-control" value={projStart} onChange={(e) => setProjStart(e.target.value)} />
                  </div>
                  <div className="col">
                    <label className="form-label">Fin du projet</label>
                    <input type="date" className="form-control" value={projEnd} onChange={(e) => setProjEnd(e.target.value)} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Capacité (max membres)</label>
                  <input type="number" min={1} className="form-control" value={maxMembers} onChange={(e) => setMaxMembers(parseInt(e.target.value || '1', 10))} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Membres</label>
                  <select multiple className="form-select" value={selectedMembers} onChange={(e) => setSelectedMembers(Array.from(e.target.selectedOptions, o => o.value))}>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                  <div className="form-text">Sélectionnez jusqu'à {maxMembers} membres.</div>
                </div>
                <button className="btn btn-primary" type="submit">Créer</button>
              </form>
            </div>
            {/* Créer une tâche projet (avec pièces jointes) */}
            <div className="card p-3">
              <h5 className="card-title mb-3">Créer une tâche de projet</h5>
              <form onSubmit={onCreateProjectTask}>
                <div className="mb-2">
                  <label className="form-label">Projet</label>
                  <select className="form-select" value={taskProject} onChange={(e) => { setTaskProject(e.target.value); setTaskMembers([]); }} required>
                    <option value="">Choisir un projet</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Titre</label>
                  <input className="form-control" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Détaillez la tâche, livrables, etc." />
                </div>
                <div className="row g-2 mb-2">
                  <div className="col">
                    <label className="form-label">Échéance</label>
                    <input type="date" className="form-control" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  </div>
                  <div className="col">
                    <label className="form-label">Priorité</label>
                    <select className="form-select" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="form-label">Assigner à</label>
                  <select multiple className="form-select" value={taskMembers} onChange={(e) => setTaskMembers(Array.from(e.target.selectedOptions, o => o.value))} disabled={!taskProject}>
                    {(projects.find(p => String(p._id) === String(taskProject))?.members || [])
                      .map(id => ({ id: String(id), name: userNameById.get(String(id)) || String(id) }))
                      .map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                  </select>
                  <div className="form-text">Vous pouvez sélectionner plusieurs membres du projet.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Pièces jointes (brief, specs) — max 5, 5Mo chacune</label>
                  <input className="form-control" type="file" multiple onChange={(e) => setTaskFiles(e.target.files)} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success" type="submit" disabled={creatingTask}>{creatingTask ? 'Création...' : 'Créer la tâche'}</button>
                  <button className="btn btn-secondary" type="button" onClick={resetTaskForm} disabled={creatingTask}>Réinitialiser</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="card p-3 mt-3">
          <h5 className="card-title mb-3">Notifications</h5>
          <div className="d-flex justify-content-end gap-2 mb-2">
            <button className="btn btn-sm btn-outline-danger" disabled={notifications.length === 0} onClick={async () => { if (!window.confirm('Supprimer toutes les notifications ?')) return; await deleteAllNotifications(); setNotifications([]); }}>Tout supprimer</button>
          </div>
          {notifications.length === 0 ? (
            <div className="text-muted">Aucune notification</div>
          ) : (
            <ul className="list-group mb-3">
              {notifications.map((it) => (
                <li key={it._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{it.title}</div>
                    <div className="small text-muted">{it.message}</div>
                    <div className="small">
                      Par: <strong>{it.data?.userName || it.data?.assignedTo || 'Inconnu'}</strong>
                      {' '}— {new Date(it.data?.at || it.createdAt).toLocaleString('fr-FR')}
                    </div>
                    {it.data?.taskId && (
                      <div className="small text-muted">Tâche ID: {it.data.taskId}</div>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {!it.read && <span className="badge bg-danger">Nouveau</span>}
                    {!it.read && <button className="btn btn-sm btn-outline-primary" onClick={async () => { await markNotificationRead(it._id); setNotifications(prev => prev.map(n => n._id === it._id ? { ...n, read: true } : n)); }}>Marquer comme lue</button>}
                    <button className="btn btn-sm btn-outline-danger" onClick={async () => { if (!window.confirm('Supprimer cette notification ?')) return; await deleteNotification(it._id); setNotifications(prev => prev.filter(n => n._id !== it._id)); }}>Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-3 mt-3">
          <h5 className="card-title mb-3">Rapports d’avancement (toutes tâches)</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Tâche</th>
                  <th>Assigné</th>
                  <th>Contenu</th>
                  <th>Pièces jointes</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allTasks.flatMap(task => (task.progressReports || []).map((r) => ({ task, r }))).map(({ task, r }) => (
                  <tr key={`${task._id}-${r._id}`}>
                    <td style={{ maxWidth: 240 }}>
                      <div className="fw-bold">{task.title}</div>
                      <div className="text-muted small">{task.projectId || 'Sans projet'}</div>
                    </td>
                    <td>{Array.isArray(task.assignedTo) ? (task.assignedTo.length > 1 ? `${task.assignedTo.length} utilisateurs` : (userNameById.get(String(task.assignedTo[0])) || task.assignedTo[0])) : (userNameById.get(String(task.assignedTo)) || task.assignedTo || '-')}</td>
                    <td style={{ maxWidth: 280 }}><div className="small" title={r.content}>{r.content}</div></td>
                    <td>
                      {(r.attachments || []).length === 0 ? (
                        <span className="text-muted small">Aucune</span>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          {r.attachments.map((a) => (
                            <a key={a.url} href={`http://localhost:5000${a.url}`} target="_blank" rel="noreferrer" className="small">{a.originalname}</a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'secondary'}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'submitted' ? (
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-success" onClick={() => openReview(task, r)}>Approuver</button>
                          <button className="btn btn-outline-danger" onClick={() => setReview({ open: true, task, report: r, progress: '', comment: '', mode: 'rejected' })}>Refuser</button>
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-3 mt-3">
          <h5 className="card-title mb-3">Toutes les tâches (assignation rapide)</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Projet</th>
                  <th>Assignée à</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allTasks.map((t) => {
                  const assignees = Array.isArray(t.assignedTo) ? t.assignedTo : (t.assignedTo ? [t.assignedTo] : []);
                  const currentAssignee = assignees.length > 0 ? String(assignees[0]) : '';
                  const names = assignees.map(id => userNameById.get(String(id)) || String(id));
                  const namesDisplay = names.length === 0 ? 'Non assignée' : (names.length <= 3 ? names.join(', ') : `${names.slice(0,3).join(', ')} +${names.length-3}`);
                  return (
                    <tr key={t._id}>
                      <td style={{ maxWidth: 260 }}>
                        <div className="fw-bold">{t.title}</div>
                        <div className="text-muted small">{t.description}</div>
                      </td>
                      <td>{t.projectId || '—'}</td>
                      <td>{namesDisplay}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <select className="form-select form-select-sm" value={currentAssignee} onChange={async (e) => { const val = e.target.value; if (!val) return; try { await adminAssignTask(t._id, val); await loadAll(); } catch (err) { alert(err?.response?.data?.message || 'Erreur assignation'); } }}>
                            <option value="">Choisir un utilisateur</option>
                            {users.map(u => (
                              <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {editProject && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Éditer le projet</h5>
                  <button type="button" className="btn-close" onClick={() => setEditProject(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Nom</label>
                    <input className="form-control" value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" value={editProject.description} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Capacité</label>
                    <input type="number" min={1} className="form-control" value={editProject.maxMembers} onChange={(e) => setEditProject({ ...editProject, maxMembers: parseInt(e.target.value || '1', 10) })} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Membres</label>
                    <select multiple className="form-select" value={(editProject.members || []).map(String)} onChange={(e) => setEditProject({ ...editProject, members: Array.from(e.target.selectedOptions, o => o.value) })}>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setEditProject(null)}>Annuler</button>
                  <button className="btn btn-primary" onClick={async () => {
                    try {
                      // 1. MAJ membres/capacité
                      await adminUpdateProjectMembers(editProject._id, { members: editProject.members, maxMembers: editProject.maxMembers });
                      // 2. MAJ nom/desc
                      await fetch(`http://localhost:5000/api/projects/${editProject._id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
                        },
                        body: JSON.stringify({ name: editProject.name, description: editProject.description })
                      });
                      await loadAll();
                      setEditProject(null);
                    } catch (e) {
                      alert(e?.response?.data?.message || 'Erreur mise à jour du projet');
                    }
                  }}>Enregistrer</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Revue d'avancement */}
        {review.open && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Valider l'avancement</h5>
                  <button type="button" className="btn-close" onClick={closeReview}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Pourcentage de progression</label>
                    <input type="number" min={0} max={100} className="form-control" value={review.progress} onChange={(e) => setReview({ ...review, progress: e.target.value })} placeholder="0 - 100" />
                    <div className="form-text">Entrez une valeur entre 0 et 100.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Commentaire (optionnel)</label>
                    <textarea className="form-control" rows={3} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeReview}>Annuler</button>
                  <button className="btn btn-primary" onClick={confirmReview}>Valider</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        {toast.show && (
          <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2000, minWidth: 280 }}>
            <div className={`alert alert-${toast.type} alert-dismissible fade show shadow`} role="alert">
              {toast.message}
              <button type="button" className="btn-close" onClick={() => setToast({ ...toast, show: false })}></button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const Admin = () => (
  <Guard>
    <AdminPage />
  </Guard>
);

export default Admin;
