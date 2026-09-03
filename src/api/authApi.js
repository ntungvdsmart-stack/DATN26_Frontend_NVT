import axiosClient from './axiosClient';

const authApi = {
  // Đăng ký tài khoản khách hàng
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },
  
  // Đăng nhập thống nhất — nhận identifier (email hoặc username) + password
  login: (data) => {
    // data = { identifier, password }
    return axiosClient.post('/auth/login', data);
  }
};

export default authApi;
