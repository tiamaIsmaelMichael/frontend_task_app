import { useState, useEffect } from "react";
import { listUsersBasic } from "../services/api";

const TaskForm = ({ onSubmit, initialData, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [visibility, setVisibility] = useState("personal"); // personal | shared
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const currentUserId = (() => { try { return JSON.parse(localStorage.getItem('userInfo'))?.id || JSON.parse(localStorage.getItem('userInfo'))?._id || null; } catch { return null; } })();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setVisibility("personal");
    setAssignedTo("");
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : "");
      setPriority(initialData.priority || "medium");
      setVisibility(initialData.visibility || "personal");
      setAssignedTo(initialData.assignedTo || "");
    } else {
      resetForm();
    }
  }, [initialData]);

  // Charger la liste des utilisateurs pour les tâches partagées
  useEffect(() => {
    const load = async () => {
      if (visibility !== 'shared') return;
      setLoadingUsers(true);
      try {
        const data = await listUsersBasic();
        // Exclure l'utilisateur courant de la liste
        const filtered = Array.isArray(data) ? data.filter(u => String(u.id) !== String(currentUserId)) : [];
        setUsers(filtered);
      } catch (e) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [visibility]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Le titre est obligatoire");
      return;
    }

    if (visibility === 'shared') {
      if (!assignedTo) {
        alert("Veuillez sélectionner un collaborateur pour la tâche partagée.");
        return;
      }
      if (currentUserId && String(assignedTo) === String(currentUserId)) {
        alert("Le collaborateur doit être une autre personne que vous.");
        return;
      }
    }

    const taskData = {
      ...initialData,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      visibility,
      assignedTo: visibility === 'shared' ? assignedTo : undefined,
    };

    onSubmit(taskData);
    if (!initialData) {
      resetForm(); // Réinitialiser le formulaire seulement pour une nouvelle tâche
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <div className="row g-3">
        <div className="col-12">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Titre *</label>
            <input
              id="title"
              type="text"
              className="form-control form-control-lg"
              placeholder="Titre de la tâche"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="col-12">
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              className="form-control"
              placeholder="Description de la tâche"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">Date d'échéance</label>
            <input
              id="dueDate"
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="form-group">
            <label htmlFor="priority" className="form-label">Priorité</label>
            <select
              id="priority"
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>

        <div className="col-12">
          <div className="form-group">
            <label htmlFor="visibility" className="form-label">Visibilité</label>
            <select
              id="visibility"
              className="form-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="personal">Tâche perso</option>
              <option value="shared">Tâche partagée</option>
            </select>
          </div>
        </div>

        {visibility === 'shared' && (
          <div className="col-12">
            <div className="form-group">
              <label htmlFor="assignedTo" className="form-label">Collaborateur</label>
              <select
                id="assignedTo"
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={loadingUsers}
                required
              >
                <option value="">{loadingUsers ? 'Chargement...' : 'Sélectionner un utilisateur'}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.email}</option>
                ))}
              </select>
              <div className="form-text">Le collaborateur sélectionné sera notifié et devra accepter ou refuser la tâche.</div>
            </div>
          </div>
        )}

        <div className="col-12">
          <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
            <button type="submit" className="btn btn-primary btn-lg w-100">
              {initialData ? "Mettre à jour" : "Ajouter"}
            </button>
            {initialData && (
              <button 
                type="button" 
                className="btn btn-secondary btn-lg w-100" 
                onClick={onCancel}
              >
                Annuler
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
