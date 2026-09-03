import axiosClient from './axiosClient';

const authApi = {
  // Đăng ký tài khoản khách hàng
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },
  
  // Đăng nhập thống nhất — dùng cho tất cả role
  login: (data) => {
    return axiosClient.post('/auth/login', data);
  }
};

export default authApi;
