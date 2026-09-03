import axiosClient from './axiosClient';

const productApi = {
  // Lấy danh sách sản phẩm
  getAll: () => {
    return axiosClient.get('/products');
  },
  
  // Lấy chi tiết sản phẩm (kèm variants, images)
  getById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  // Lấy dữ liệu thuộc tính (Categories, Brands, Colors, Sizes...) để làm Form
  getFormAttributes: () => {
    return axiosClient.get('/products/attributes/all');
  },
  
  // Tạo sản phẩm mới
  create: (data) => {
    return axiosClient.post('/products', data);
  },
  
  // Đổi trạng thái (Khóa/Mở bán)
  toggleStatus: (id, isActive) => {
    return axiosClient.patch(`/products/${id}/status`, { is_active: isActive });
  }
};

export default productApi;
