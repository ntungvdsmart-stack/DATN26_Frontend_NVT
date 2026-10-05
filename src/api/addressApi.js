import axiosClient from './axiosClient';

const addressApi = {
  get: () => axiosClient.get('/addresses'),
  add: (data) => axiosClient.post('/addresses', data),
  remove: (id) => axiosClient.delete(`/addresses/${id}`),
  setDefault: (id) => axiosClient.put(`/addresses/${id}/default`)
};

export default addressApi;
