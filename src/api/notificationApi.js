import axiosClient from './axiosClient';

const notificationApi = {
  getAll: () => axiosClient.get('/notifications'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: (beforeId) => axiosClient.put('/notifications/read-all', { before_id: beforeId }),
};

export default notificationApi;
