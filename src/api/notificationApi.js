import axiosClient from './axiosClient';

const notificationApi = {
  getAll: () => axiosClient.get('/notifications'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/notifications/read-all'),
};

export default notificationApi;
