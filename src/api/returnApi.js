import axiosClient from './axiosClient';

const returnApi = {
  createRequest: (data) => axiosClient.post('/returns/request', data),
  getAll: () => axiosClient.get('/returns'),
  updateStatus: (id, status) => axiosClient.put(`/returns/${id}/status`, { status })
};

export default returnApi;
