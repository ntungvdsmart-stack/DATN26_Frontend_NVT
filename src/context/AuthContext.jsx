import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest'); 
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo từ LocalStorage khi mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role || 'customer');
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu người dùng đã lưu:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Đăng nhập thống nhất — Backend tự phân biệt role
  // identifier = email hoặc username (staff có thể dùng cả 2)
  const login = async (identifier, password) => {
    try {
      const response = await authApi.login({ identifier, password });
      if (response && response.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setRole(userData.role);
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
  };

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
