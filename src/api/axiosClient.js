import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Cấu hình URL gốc của Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động đính kèm Token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor bắt lỗi response toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data; // Chỉ trả về phần data thật sự
    }
    return response;
  },
  (error) => {
    // Trả về object lỗi custom để dễ xử lý hơn
    const errorData = error.response ? error.response.data : { message: error.message };
    return Promise.reject(errorData);
  }
);

export default axiosClient;
