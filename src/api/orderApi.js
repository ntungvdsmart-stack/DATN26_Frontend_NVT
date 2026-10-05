import axiosClient from './axiosClient';

const orderApi = {
  // === Admin/Staff ===
  getAllOrders: (params = {}) => axiosClient.get('/orders/admin', { params }),
  getOrderById: (id) => axiosClient.get(`/orders/admin/${id}`),
  updateStatus: (id, status, note = '') => axiosClient.patch(`/orders/admin/${id}/status`, { status, note }),
  getBranchSuggestions: (id) => axiosClient.get(`/orders/admin/${id}/branch-suggestions`),
  assignOrder: (id, data) => axiosClient.post(`/orders/admin/${id}/assign`, data),
  deleteOrder: (id) => axiosClient.delete(`/orders/admin/${id}`),

  // === Public / Customer: tạo đơn hàng online ===
  create: (payload) => axiosClient.post('/orders', payload),

  // === POS: tạo đơn hàng tại quầy ===
  createPOS: (orderData) => axiosClient.post('/orders/pos', orderData),

  // === Tra cứu đơn hàng ===
  trackOrder: (orderCode) => axiosClient.get(`/orders/tracking/${orderCode}`),
  cancelOrder: (orderCode, reason) => axiosClient.post(`/orders/customer/${orderCode}/cancel`, { reason }),

  // Alias cũ để không break StaffPages.jsx cũ
  getAllAdmin: (params = {}) => axiosClient.get('/orders/admin', { params }),
};

export default orderApi;
