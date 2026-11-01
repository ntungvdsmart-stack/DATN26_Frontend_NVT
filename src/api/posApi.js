import axiosClient from './axiosClient';

const posApi = {
  // Lấy danh sách sản phẩm để hiển thị trên POS (cần data admin để xem tồn kho)
  getProducts: () => {
    return axiosClient.get('/products/admin/all');
  },
  
  // Thanh toán (Tạo đơn hàng POS)
  checkout: (orderData) => {
    return axiosClient.post('/orders/pos', orderData);
  },
  
  // Áp dụng khuyến mãi
  applyPromotion: (code, subtotal) => {
    return axiosClient.post('/promotions/apply', { code, subtotal, channel: 'pos' });
  }
};

export default posApi;
