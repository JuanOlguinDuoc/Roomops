import api from './api';

const BASE = '/api/v1/users';

export const getUsers = () => api.get(BASE).then(r => r.data);
export const getUser = (id) => api.get(`${BASE}/${id}`).then(r => r.data);
export const createUser = (payload) => api.post(BASE, payload).then(r => r.data);
export const updateUser = (id, payload) => api.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteUser = (id) => api.delete(`${BASE}/${id}`).then(r => r.data);
// El backend no elimina físicamente: solo permite activar/desactivar el usuario.
export const updateUserEstado = (id, activo) => api.patch(`${BASE}/${id}/estado`, null, { params: { activo } }).then(r => r.data);

export const login = (credentials) => api.post('/api/v1/auth/login', credentials).then(r => r.data);
export const register = (payload) => api.post('/api/v1/auth/register', payload).then(r => r.data);

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserEstado,
  login,
  register
};