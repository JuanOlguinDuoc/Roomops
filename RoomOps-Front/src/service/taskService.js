import api from './api';

const BASE = '/api/v1/tasks';

export const getTasks = () => api.get(BASE).then(r => r.data);
export const getTask = (id) => api.get(`${BASE}/${id}`).then(r => r.data);
export const createTask = (payload) => api.post(BASE, payload).then(r => r.data);
export const updateTask = (id, payload) => api.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteTask = (id) => api.delete(`${BASE}/${id}`).then(r => r.data);

export default {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};
