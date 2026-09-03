import axiosClient from './axiosClient';

const accountApi = {
  // Lấy danh sách tài khoản
  getAll: () => {
    return axiosClient.get('/accounts');
  },
  
  // Tạo tài khoản mới
  create: (data) => {
    return axiosClient.post('/accounts', data);
  },
  
  // Cập nhật thông tin tài khoản
  update: (id, data) => {
    return axiosClient.put(`/accounts/${id}`, data);
  },
  
  // Khóa/Mở khóa tài khoản
  toggleStatus: (id, isActive) => {
    return axiosClient.patch(`/accounts/${id}/status`, { is_active: isActive });
  }
};

export default accountApi;
