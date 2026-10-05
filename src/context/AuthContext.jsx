import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';
import { useWishlistStore } from '../store/wishlistStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest'); 
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token hết hạn
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Token mã hoá không hợp lệ → coi như hết hạn
    }
  };

  // Khởi tạo từ LocalStorage khi mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      // Kiểm tra token có hết hạn không trước khi dùng
      if (isTokenExpired(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoading(false);
        return;
      }
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role || 'customer');
        if (parsedUser.role === 'customer') {
          useWishlistStore.getState().fetchWishlist();
        }
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu người dùng đã lưu:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Đăng nhập thống nhất — Backend tự phân biệt role
  // identifier = email
  const login = async (identifier, password) => {
    try {
      const response = await authApi.login({ identifier, password });
      if (response && response.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setRole(userData.role || 'customer');
        if (userData.role === 'customer') {
          useWishlistStore.getState().fetchWishlist();
        }
        return { success: true, role: userData.role };
      }
      return { success: false, message: response?.message || 'Đăng nhập thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi kết nối tới máy chủ' };
    }
  };

  // Đăng ký khách hàng mới
  const register = async (full_name, email, password, phone) => {
    try {
      const response = await authApi.register({ full_name, email, password, phone });
      if (response && response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, message: response?.message || 'Đăng ký thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Lỗi kết nối tới máy chủ' };
    }
  };

  // Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setRole('guest');
    import('sonner').then(({ toast }) => {
      toast.success('Đã đăng xuất thành công!');
    });
    setTimeout(() => {
      window.location.href = '/login';
    }, 800);
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
