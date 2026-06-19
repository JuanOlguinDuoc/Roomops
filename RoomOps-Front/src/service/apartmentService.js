import api from './api';

const BASE = '/api/v1/apartments';

export const getApartments = () => api.get(BASE).then(r => r.data);
export const getApartment = (id) => api.get(`${BASE}/${id}`).then(r => r.data);
export const createApartment = (payload) => api.post(BASE, payload).then(r => r.data);
export const updateApartment = (id, payload) => api.put(`${BASE}/${id}`, payload).then(r => r.data);
// El backend no elimina físicamente: solo permite activar/desactivar el apartamento.
export const updateApartmentEstado = (id, activo) => api.patch(`${BASE}/${id}/estado`, null, { params: { activo } }).then(r => r.data);

export default {
    getApartments,
    getApartment,
    createApartment,
    updateApartment,
    updateApartmentEstado
};