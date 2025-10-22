import React, { useState } from "react";
import { acceptTaskApi, declineTaskApi, submitProgressApi, getTaskReports, BACKEND_ORIGIN } from "../services/api";

const formatDate = (dateString) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPriorityBadge = (priority) => {
  const badges = {
    low: "bg-success",
    medium: "bg-warning",
    high: "bg-danger"
  };
  const labels = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute"
  };
  return (
    <span className={`badge ${badges[priority]} me-2`}>
      {labels[priority]}
    </span>
  );
};

const getProgressColor = (progress) => {
  if (progress >= 75) return "success";
  if (progress >= 50) return "info";
  if (progress >= 25) return "warning";
  return "danger";
};

const TaskList = ({ tasks, onToggleComplete, onEdit, onDelete, currentUserId }) => {
  const [activeTask, setActiveTask] = useState(null);
  const [progressContent, setProgressContent] = useState("");
  const [progressFiles, setProgressFiles] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2000);
  };

  const userRole = (() => { try { return JSON.parse(localStorage.getItem('userInfo'))?.role || 'user'; } catch { return 'user'; } })();
  const isAdminRole = userRole === 'admin';

  const onAccept = async (taskId) => {
    try { setError(""); await acceptTaskApi(taskId); window.location.reload(); } catch (e) { setError(e?.response?.data?.message || 'Erreur'); }
  };
  const onDecline = async (taskId) => {
    try { setError(""); await declineTaskApi(taskId); window.location.reload(); } catch (e) { setError(e?.response?.data?.message || 'Erreur'); }
  };
  const onSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      setError("");
      if (!activeTask) return;
      await submitProgressApi(activeTask._id, progressContent, Array.from(progressFiles));
      setActiveTask(null);
      setProgressContent("");
      setProgressFiles([]);
      showToast('success', 'Avancement envoyé avec succès.');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) { setError(e?.response?.data?.message || 'Erreur envoi avancement'); }
  };

  const canCurrentUserSubmit = (task) => {
    const isAuthor = String(task.userId) === String(currentUserId);
    const isShared = task.visibility === 'shared';
    const isAssignee = Array.isArray(task.assignedTo) ? task.assignedTo.map(String).includes(String(currentUserId)) : String(task.assignedTo) === String(currentUserId);
    const accepted = task.participationStatus === 'accepted';
    return (isShared && isAuthor) || (isAssignee && accepted);
  };

  const canViewReports = (task) => {
    const isAuthor = String(task.userId) === String(currentUserId);
    const isAssignee = Array.isArray(task.assignedTo) ? task.assignedTo.map(String).includes(String(currentUserId)) : String(task.assignedTo) === String(currentUserId);
    return isAuthor || isAssignee;
  };

  const [reportsOpenFor, setReportsOpenFor] = useState(null);
  const [reportsData, setReportsData] = useState({ task: null, reports: [] });
  const [reportsError, setReportsError] = useState("");
  const [reportsLoading, setReportsLoading] = useState(false);

  const openReports = async (task) => {
    try {
      setReportsError("");
      setReportsLoading(true);
      setReportsOpenFor(task._id);
      const res = await getTaskReports(task._id);
      setReportsData(res);
    } catch (e) {
      setReportsError(e?.response?.data?.message || 'Erreur lors du chargement des soumissions.');
    } finally {
      setReportsLoading(false);
    }
  };

  const fileUrl = (path) => {
    if (!path) return '#';
    if (/^https?:\/\//i.test(path)) return path;
    return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const canDelete = (task) => {
    const isOwner = String(task.userId) === String(currentUserId);
    const isProject = !!task.projectId;
    if (isProject) {
      return isAdminRole; // tâches projet: admin uniquement
    }
    return isOwner || isAdminRole; // autres: créateur ou admin
  };

  const canEdit = (task) => {
    const isOwner = String(task.userId) === String(currentUserId);
    const isProject = !!task.projectId;
    return isProject ? isAdminRole : isOwner;
  };

  const canToggleComplete = (task) => {
    const isOwner = String(task.userId) === String(currentUserId);
    const isProject = !!task.projectId;
    return isProject ? isAdminRole : isOwner;
  };

  return (
    <div className="task-list">
      {toast.show && (
        <div style={{ position: 'fixed', top: 72, right: 16, zIndex: 2000, minWidth: 260 }}>
          <div className={`alert alert-${toast.type} alert-dismissible fade show shadow`} role="alert">
            {toast.message}
            <button type="button" className="btn-close" onClick={() => setToast({ ...toast, show: false })}></button>
          </div>
        </div>
      )}
      {tasks.length === 0 ? (
        <div className="text-center text-muted p-4">
          <i className="bi bi-inbox fs-1 d-block mb-3"></i>
          Aucune tâche à afficher
        </div>
      ) : (
        <div className="list-group">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`list-group-item ${
                task.completed ? "list-group-item-success bg-opacity-25" : ""
              }`}
            >
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="me-auto">
                    <h5
                      className="mb-1"
                      style={{
                        textDecoration: task.completed ? "line-through" : "none",
                      }}
                    >
                      {task.title}
                    </h5>
                    {task.description && (
                      <p className="mb-1 text-muted">{task.description}</p>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    {canEdit(task) && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => onEdit(task)}
                      >
                        <i className="bi bi-pencil"></i>
                        <span className="d-none d-sm-inline ms-1">Modifier</span>
                      </button>
                    )}
                    {canDelete(task) && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(task._id)}
                      >
                        <i className="bi bi-trash"></i>
                        <span className="d-none d-sm-inline ms-1">Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <div className="form-check mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => { if (canToggleComplete(task)) { onToggleComplete(task._id, !task.completed); } }}
                      id={`complete-${task._id}`}
                      disabled={!canToggleComplete(task)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`complete-${task._id}`}
                    >
                      Terminée
                    </label>
                  </div>

                  {getPriorityBadge(task.priority || "medium")}

                  {task.dueDate && (
                    <div className="small">
                      <i className="bi bi-calendar-event me-1"></i>
                      Échéance : {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>

                {task.projectId && (
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className={`progress-bar bg-${getProgressColor(task.progress || 0)}`}
                      role="progressbar"
                      style={{ width: `${task.progress || 0}%` }}
                      aria-valuenow={task.progress || 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center small text-muted">
                  {task.projectId && (
                    <span>Progression : {task.progress || 0}%</span>
                  )}
                  <div>
                    <span className="me-2">
                      <i className="bi bi-clock-history me-1"></i>
                      Créée le : {formatDate(task.createdAt)}
                    </span>
                    {task.updatedAt !== task.createdAt && (
                      <span>
                        <i className="bi bi-pencil-square me-1"></i>
                        Modifiée le : {formatDate(task.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {(Array.isArray(task.assignedTo) ? task.assignedTo.length > 0 : !!task.assignedTo) && (
                  <div className="d-flex align-items-center gap-2">
                    {task.participationStatus === 'pending' && (Array.isArray(task.assignedTo) ? task.assignedTo.map(String).includes(String(currentUserId)) : String(task.assignedTo) === String(currentUserId)) && (
                      <>
                        <button className="btn btn-sm btn-outline-success" onClick={() => onAccept(task._id)}>Accepter</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => onDecline(task._id)}>Refuser</button>
                      </>
                    )}
                    {(canCurrentUserSubmit(task)) && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTask(task)}>Soumettre un avancement</button>
                    )}
                    {(canViewReports(task)) && (
                      <button className="btn btn-sm btn-outline-info" onClick={() => openReports(task)}>
                        Voir les soumissions
                      </button>
                    )}
                    <span className="badge bg-light text-dark border">
                      {Array.isArray(task.assignedTo)
                        ? (task.assignedTo.map(String).includes(String(currentUserId)) ? 'Assignée à vous' : `Collaborateurs: ${task.assignedTo.length}`)
                        : (String(task.assignedTo) === String(currentUserId) ? 'Assignée à vous' : `Assignée (${String(task.assignedTo).slice(-4)})`)
                      }
                    </span>
                    <span className={`badge ${task.participationStatus === 'accepted' ? 'bg-success' : task.participationStatus === 'declined' ? 'bg-danger' : 'bg-secondary'}`}>
                      {task.participationStatus || 'pending'}
                    </span>
                  </div>
                )}
              </div>
              {activeTask && activeTask._id === task._id && (
                <div className="mt-2">
                  {error && <div className="alert alert-danger py-1 my-2">{error}</div>}
                  <form onSubmit={onSubmitProgress}>
                    <div className="mb-2">
                      <label className="form-label">Description de l'avancement</label>
                      <textarea className="form-control" value={progressContent} onChange={(e) => setProgressContent(e.target.value)} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Pièces jointes (max 5, 5Mo chacune)</label>
                      <input className="form-control" type="file" multiple onChange={(e) => setProgressFiles(e.target.files)} />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary btn-sm" type="submit">Envoyer</button>
                      <button className="btn btn-secondary btn-sm" type="button" onClick={() => { setActiveTask(null); setProgressContent(""); setProgressFiles([]); }}>Annuler</button>
                    </div>
                  </form>
                </div>
              )}
              {reportsOpenFor && reportsOpenFor === task._id && (
                <div className="mt-2 border rounded p-2 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Soumissions d'avancement</strong>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setReportsOpenFor(null); setReportsData({ task: null, reports: [] }); }}>Fermer</button>
                  </div>
                  {reportsError && <div className="alert alert-danger py-1 my-2">{reportsError}</div>}
                  {reportsLoading ? (
                    <div className="text-muted">Chargement...</div>
                  ) : reportsData.reports?.length > 0 ? (
                    <ul className="list-group">
                      {reportsData.reports.map((r) => (
                        <li key={r._id} className="list-group-item">
                          <div className="d-flex justify-content-between">
                            <div className="small text-muted">Par: {r.userId} — {formatDate(r.createdAt)}</div>
                            <span className={`badge ${r.status === 'approved' ? 'bg-success' : r.status === 'rejected' ? 'bg-danger' : 'bg-secondary'}`}>{r.status}</span>
                          </div>
                          <div className="mt-1">{r.content}</div>
                          {r.reviewComment && (
                            <div className="small text-muted mt-1">Commentaire: {r.reviewComment}</div>
                          )}
                          {Array.isArray(r.attachments) && r.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="small fw-bold">Pièces jointes</div>
                              <ul className="small mb-0">
                                {r.attachments.map((a, idx) => (
                                  <li key={idx}><a href={fileUrl(a.url)} target="_blank" rel="noreferrer">{a.originalname || a.filename}</a></li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted">Aucune soumission pour cette tâche.</div>
                  )}
                </div>
              )}
              {Array.isArray(task.participationLogs) && task.participationLogs.length > 0 && (
                <div className="mt-2 small text-muted">
                  <div className="fw-bold">Historique participation</div>
                  <ul className="mb-0">
                    {task.participationLogs.map((p, idx) => (
                      <li key={idx}>{p.userName || p.userId}: {p.status} — {new Date(p.at).toLocaleString('fr-FR')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
