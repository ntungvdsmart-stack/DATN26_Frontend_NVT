import axiosClient from './axiosClient';

const branchApi = {
  getAll: () => axiosClient.get('/branches'),
  create: (data) => axiosClient.post('/branches', data),
  update: (id, data) => axiosClient.put(`/branches/${id}`, data),
  toggleStatus: (id, isActive) => axiosClient.patch(`/branches/${id}/status`, { is_active: isActive }),
};

export default branchApi;
