import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Cấu hình URL gốc của Backend từ biến môi trường
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động đính kèm Token vào mỗi request
// + Xóa Content-Type khi gửi FormData để Axios tự set multipart/form-data với boundary
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Khi gửi FormData (upload file), phải để trình duyệt tự set Content-Type
    // kèm boundary, nếu ép 'application/json' hoặc 'multipart/form-data' 
    // thì multer sẽ không parse được file
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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
    if (error.response?.status === 401 && localStorage.getItem('token') && !error.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    // Giữ nguyên axios error để code dùng error.response?.data?.message hoạt động đúng
    // Nhưng đính thêm shorthand message cho tiện
    if (error.response && error.response.data) {
      error.message = error.response.data.message || error.message;
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
