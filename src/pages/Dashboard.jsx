import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");
  const [section, setSection] = useState("personal"); // personal | shared | assigned
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Pagination (pour plus de confort visuel)
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("userInfo"));

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des tâches :", err);
      setError("Impossible de charger les tâches. Veuillez réessayer.");
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  let token = localStorage.getItem('userToken') || localStorage.getItem('token');
  if (!token) {
    try { token = JSON.parse(localStorage.getItem('userInfo') || '{}')?.token; } catch {}
  }
  if (!token) {
    navigate("/login");
  } else {
    fetchTasks();
  }
}, [fetchTasks, navigate]);

  // Repartir à la page 1 quand les filtres changent ou la liste varie
  useEffect(() => { setPage(1); }, [filter, section, tasks.length]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const handleSubmit = async (taskData) => {
    try {
      setError(null);
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, taskData);
        setEditingTask(null);
      } else {
        await api.post("/tasks", taskData);
      }
      fetchTasks();
    } catch (err) {
      console.error("Erreur lors de la soumission de la tâche :", err);
      setError("Impossible de sauvegarder la tâche. Veuillez réessayer.");
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      setError(null);
      // Optimistic update: update local state immediately
      setTasks((prev) => prev.map(t => t._id === id ? { ...t, completed } : t));
      await api.put(`/tasks/${id}`, { completed });
      // Optionally refresh from server to stay in sync
      // await fetchTasks();
    } catch (err) {
      console.error("Erreur lors du changement d'état de la tâche :", err);
      setError(
        "Impossible de mettre à jour l'état de la tâche. Veuillez réessayer."
      );
      // Revert on error by refetching
      fetchTasks();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmez-vous la suppression ?")) return;
    try {
      setError(null);
      await api.delete(`/tasks/${id}`);
      // Optimistic update: remove task locally to update counters immediately
      setTasks((prev) => prev.filter((t) => t._id !== id));
      // Optionally refresh from server to confirm
      // await fetchTasks();
    } catch (err) {
      console.error("Erreur lors de la suppression de la tâche :", err);
      setError("Impossible de supprimer la tâche. Veuillez réessayer.");
      // Re-sync state on error
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Section
    if (section === 'personal' && task.visibility !== 'personal') return false;
    if (section === 'shared' && task.visibility !== 'shared') return false;
    if (section === 'assigned' && String(task.assignedTo || '') !== String(user?.id || user?._id || '')) return false;
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    if (filter === "assigned") return String(task.assignedTo || '') === String(user?.id || user?._id || '');
    return true;
  });

  // Pagination sur la liste filtrée
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const visibleTasks = filteredTasks.slice(start, start + itemsPerPage);

  const currentUserId = String(user?.id || user?._id || "");
  const assignedToMe = tasks.filter((t) => String(t.assignedTo || "") === currentUserId);

  if (!user) {
    return <div>Redirection vers la page de connexion...</div>;
  }

  return (
    <Layout>
      <div
        className="container-fluid container-md mt-3 px-2 px-md-3"
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          boxShadow: "0 2px 16px rgba(35,41,70,0.06)",
          padding: "1rem",
          minHeight: "auto",
        }}
      >
        <h1
          className="mb-3 fw-bold text-center"
          style={{
            color: "#232946",
            letterSpacing: "0.5px",
            fontSize: "clamp(1.4rem, 3vw, 1.8rem)",
          }}
        >
          ENREGISTREMENT DES TACHES
        </h1>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Formulaire d'ajout/modification */}
        <div
          className="card mb-3 shadow-sm"
          style={{ borderRadius: "0.8rem", border: "none" }}
        >
          <div className="card-body p-3">
            <h5 className="card-title mb-3" style={{ color: "#0d6efd" }}>
              {editingTask ? "Modifier la tâche" : "Ajouter une tâche"}
            </h5>
            <TaskForm
              onSubmit={handleSubmit}
              initialData={editingTask}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>

        {/* Sections & Filtres (compacts) */}
        <div className="mb-3">
          <h6 className="mb-3 py-2 shadow-sm text-center fw-bold" style={{ color: "#232946" }}>Mes Tâches</h6>
          <div className="d-flex flex-wrap gap-2 mb-2">
            {[{k:'personal',l:'Tâches perso'},{k:'shared',l:'Tâches partagées'},{k:'assigned',l:'Tâches assignées'}].map(s => (
              <button key={s.k} className={`btn btn-sm ${section===s.k? 'btn-success':'btn-outline-success'}`} onClick={()=>setSection(s.k)}>{s.l}</button>
            ))}
          </div>
          <h6 className="mb-2" style={{ color: "#232946" }}>Filtres</h6>
          <div className="d-flex flex-wrap gap-2">
            {["all", "pending", "completed"].map((f) => (
              <button key={f} className={`btn btn-sm ${filter===f? 'btn-primary':'btn-outline-primary'}`} onClick={()=>setFilter(f)}>
                {f === 'all' ? 'Toutes' : f === 'pending' ? 'À faire' : 'Terminées'}
              </button>
            ))}
          </div>
        </div>

        {/* État du chargement */}
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Liste des tâches paginée */}
            <div className="mb-3">
              <TaskList
                tasks={visibleTasks}
                onToggleComplete={toggleComplete}
                onEdit={setEditingTask}
                onDelete={handleDelete}
                currentUserId={user?.id || user?._id}
              />
              {/* Pagination controls */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="small text-muted">
                  Page {page} / {totalPages} — {filteredTasks.length} éléments
                </div>
                <div className="btn-group">
                  <button className="btn btn-outline-secondary btn-sm" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Précédent</button>
                  <button className="btn btn-outline-secondary btn-sm" disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Suivant</button>
                </div>
              </div>
            </div>

            <hr className="my-3" />

            {/* Statistiques (compactes) */}
            <div className="mb-3">
              <h6 className="mb-3 fw-bold text-center" style={{ color: "#232946" }}>
                Statistiques
              </h6>
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ background: "#e3f0ff" }}>
                    <div className="card-body py-3">
                      <h6 className="mb-1" style={{ color: "#232946" }}>Total</h6>
                      <span className="fw-bold fs-4" style={{ color: "#0d6efd" }}>{total}</span>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ background: "#b1d9f5" }}>
                    <div className="card-body py-3">
                      <h6 className="mb-1" style={{ color: "#232946" }}>Terminées</h6>
                      <span className="fw-bold fs-4" style={{ color: "#198754" }}>{completed}</span>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-lg-4">
                  <div className="card border-0 shadow-sm h-100" style={{ background: "#fff" }}>
                    <div className="card-body py-3">
                      <h6 className="mb-1" style={{ color: "#232946" }}>À faire</h6>
                      <span className="fw-bold fs-4" style={{ color: "#dc3545" }}>{pending}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignées à moi (raccourci) */}
            <div className="mb-3">
              <h6 className="mb-3 fw-bold" style={{ color: "#232946" }}>Tâches assignées à moi</h6>
              {assignedToMe.length === 0 ? (
                <div className="text-muted">Aucune tâche assignée.</div>
              ) : (
                <ul className="list-group">
                  {assignedToMe.map((t) => (
                    <li key={t._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-semibold">{t.title}</span>
                        {t.description && <span className="text-muted"> — {t.description}</span>}
                      </div>
                      <span className={`badge ${t.participationStatus === 'accepted' ? 'bg-success' : t.participationStatus === 'declined' ? 'bg-danger' : 'bg-secondary'}`}>{t.participationStatus || 'pending'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Historique */}
            <div className="mb-3">
              <h6 className="mb-3 text-center" style={{ color: "#232946" }}>
                Historique des tâches terminées
              </h6>
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush">
                    {tasks.filter((t) => t.completed).length === 0 ? (
                      <li className="list-group-item text-muted text-center py-4">
                        Aucune tâche terminée.
                      </li>
                    ) : (
                      tasks
                        .filter((t) => t.completed)
                        .map((t) => (
                          <li key={t._id} className="list-group-item">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2">
                              <div>
                                <span className="fw-semibold">{t.title}</span>
                                {t.description && (
                                  <span className="text-muted d-block d-md-inline"> — {t.description}</span>
                                )}
                              </div>
                              <span className="small text-secondary">{new Date(t.createdAt).toLocaleString()}</span>
                            </div>
                          </li>
                        ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
