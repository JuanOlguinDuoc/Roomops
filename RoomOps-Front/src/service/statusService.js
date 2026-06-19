import api from './api';

const BASE = '/api/v1/status';

export const getStatuses = () => api.get(BASE).then(r => r.data);
export const getStatus = (id) => api.get(`${BASE}/${id}`).then(r => r.data);
export const createStatus = (payload) => api.post(BASE, payload).then(r => r.data);
export const updateStatus = (id, payload) => api.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteStatus = (id) => api.delete(`${BASE}/${id}`).then(r => r.data);

export default {
  getStatuses,
  getStatus,
  createStatus,
  updateStatus,
  deleteStatus
};
