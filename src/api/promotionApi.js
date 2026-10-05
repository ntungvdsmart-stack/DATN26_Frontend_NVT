import axiosClient from './axiosClient';

const promotionApi = {
  // Admin APIs
  getAll: () => axiosClient.get('/promotions'),
  create: (data) => axiosClient.post('/promotions', data),
  update: (id, data) => axiosClient.put(`/promotions/${id}`, data),
  delete: (id) => axiosClient.delete(`/promotions/${id}`),

  // Public/Customer APIs
  apply: (code, subtotal, channel = 'online') => 
    axiosClient.post('/promotions/apply', { code, subtotal, channel })
};

export default promotionApi;
