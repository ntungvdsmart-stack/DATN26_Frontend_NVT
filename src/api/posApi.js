import axiosClient from './axiosClient';

const posApi = {
  // Lấy danh sách sản phẩm để hiển thị trên POS (tương tự products list, nhưng có thể cần filter đặc biệt)
  getProducts: () => {
    return axiosClient.get('/products');
  },
  
  // Thanh toán (Tạo đơn hàng POS)
  checkout: (orderData) => {
    return axiosClient.post('/orders/pos', orderData);
  }
};

export default posApi;
