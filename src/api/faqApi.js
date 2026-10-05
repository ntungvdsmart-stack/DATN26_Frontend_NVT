import axiosClient from './axiosClient';

const faqApi = {
  getActive: () => axiosClient.get('/faqs/active'),
  getAll: () => axiosClient.get('/faqs'),
  create: (data) => axiosClient.post('/faqs', data),
  update: (id, data) => axiosClient.put(`/faqs/${id}`, data),
  remove: (id) => axiosClient.delete(`/faqs/${id}`)
};

export default faqApi;
