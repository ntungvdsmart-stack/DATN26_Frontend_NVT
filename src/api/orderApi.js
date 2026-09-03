import axiosClient from './axiosClient';

const orderApi = {
  // Tạo đơn hàng mới từ Storefront
  create: (payload) => axiosClient.post('/orders', payload),

  // Lấy danh sách đơn hàng cho Admin
  getAllAdmin: () => axiosClient.get('/orders/admin'),

  // Cập nhật trạng thái đơn (Admin)
  updateStatus: (id, payload) => axiosClient.patch(`/orders/admin/${id}/status`, payload),
};

export default orderApi;
