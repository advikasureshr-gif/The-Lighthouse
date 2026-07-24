import api from './client';

export const getReviews = (params = {}) => api.get('/reviews', { params });
export const createReview = (data) => api.post('/reviews', data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
