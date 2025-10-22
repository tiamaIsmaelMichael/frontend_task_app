// frontend/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://backend-task-7g1k.onrender.com/api",
  withCredentials: true,
  timeout: 10000, // timeout après 10 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Exporte l'origine backend (ex: http://localhost:5000) pour les liens statiques
export const BACKEND_ORIGIN = (() => {
  try {
    const url = new URL(api.defaults.baseURL);
    // Si baseURL finit par /api, on remonte d'un niveau
    return url.pathname.replace(/\/?api\/?$/, '')
      ? `${url.origin}${url.pathname.replace(/\/?api\/?$/, '')}`
      : url.origin;
  } catch {
    // fallback si baseURL n'est pas une URL absolue
    return 'http://localhost:5000';
  }
})();

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    // Récupération du token (session uniquement, non persistant)
    let token = sessionStorage.getItem('userToken');
    if (!token) token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide → nettoyer et rediriger si pas déjà sur /login
      localStorage.removeItem('userToken');
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      // Ne pas forcer de redirection immédiate ici pour éviter les rebonds; laisser les gardes de route décider.
    }
    return Promise.reject(error);
  }
);

export default api;

// Helpers profil
export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/me', payload);
  // Mettre à jour le localStorage si nécessaire
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const merged = { ...userInfo, ...data.user };
  localStorage.setItem('userInfo', JSON.stringify(merged));
  return data;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; // { url }
};

// Admin helpers
export const adminListUsers = async () => (await api.get('/users/admin')).data;
export const adminDeleteUser = async (id) => (await api.delete(`/users/admin/${id}`)).data;
export const adminResetPassword = async (id, newPassword) => (await api.post(`/users/admin/${id}/reset-password`, { newPassword })).data;

export const adminCreateProject = async (payload) => (await api.post('/projects', payload)).data;
export const adminListProjects = async () => (await api.get('/projects')).data;
export const adminDeleteProject = async (id) => (await api.delete(`/projects/${id}`)).data;
export const adminUpdateProjectMembers = async (id, payload) => (await api.put(`/projects/${id}/members`, payload)).data;

export const adminListAllTasks = async () => (await api.get('/tasks/admin/all')).data;
export const adminAssignTask = async (id, userId) => (await api.post(`/tasks/admin/${id}/assign`, { userId })).data;
export const adminValidateTask = async (id) => (await api.post(`/tasks/admin/${id}/validate`)).data;
export const adminMarkTaskDone = async (id) => (await api.post(`/tasks/admin/${id}/done`)).data;
export const adminTeamStats = async () => (await api.get('/tasks/admin/stats')).data;
export const adminReviewProgress = async (taskId, reportId, decision, comment = '', progress) => {
  const body = { decision, comment };
  if (progress !== undefined && progress !== null) body.progress = progress;
  return (await api.post(`/tasks/admin/${taskId}/progress/${reportId}/review`, body)).data;
};

// Créer une tâche projet (avec pièces jointes)
export const adminCreateProjectTask = async ({ title, description, dueDate, priority = 'medium', projectId, assignedTo = [], files = [] }) => {
  const form = new FormData();
  form.append('title', title);
  if (description) form.append('description', description);
  if (dueDate) form.append('dueDate', dueDate);
  if (priority) form.append('priority', priority);
  form.append('projectId', projectId);
  // assignedTo peut être un tableau
  (Array.isArray(assignedTo) ? assignedTo : [assignedTo]).filter(Boolean).forEach(id => form.append('assignedTo', id));
  (files || []).forEach(f => form.append('files', f));
  const { data } = await api.post('/tasks/admin/project-task', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};

// Task participation & progress
export const acceptTaskApi = async (id) => (await api.post(`/tasks/${id}/accept`)).data;
export const declineTaskApi = async (id) => (await api.post(`/tasks/${id}/decline`)).data;
export const submitProgressApi = async (id, content, files=[]) => {
  const form = new FormData();
  form.append('content', content);
  files.forEach(f => form.append('files', f));
  const { data } = await api.post(`/tasks/${id}/progress`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
};
export const getTaskReports = async (id) => (await api.get(`/tasks/${id}/progress`)).data;

// Notifications
export const listNotifications = async () => (await api.get('/notifications')).data;
export const markNotificationRead = async (id) => (await api.post(`/notifications/${id}/read`)).data;
export const deleteNotification = async (id) => (await api.delete(`/notifications/${id}`)).data;
export const deleteAllNotifications = async () => (await api.delete(`/notifications`)).data;

// Users (basic list for shared tasks)
export const listUsersBasic = async () => (await api.get('/users/list-basic')).data;
