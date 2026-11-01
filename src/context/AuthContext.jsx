import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';
import { useWishlistStore } from '../store/wishlistStore';
import { jwtDecode } from 'jwt-decode';
import { canAccess, homeForUser } from '../lib/permissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest'); 
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token hết hạn
  const isTokenExpired = (token) => {
    try {
      const payload = jwtDecode(token);
      return !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now();
    } catch {
      return true; // Token mã hoá không hợp lệ → coi như hết hạn
    }
  };

  // Khởi tạo từ LocalStorage khi mount
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setRole('guest');
      useWishlistStore.getState().clearAll();
    };
    window.addEventListener('auth-expired', expire);
    return () => window.removeEventListener('auth-expired', expire);
  }, []);

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
        JSON.parse(storedUser);
        authApi.me().then(response => {
          setUser(response.data);
          setRole(response.data.role);
          localStorage.setItem('user', JSON.stringify(response.data));
          if (response.data.role === 'customer') useWishlistStore.getState().fetchWishlist();
        }).catch(() => {
          localStorage.removeItem('token'); localStorage.removeItem('user');
        }).finally(() => setIsLoading(false));
        return;
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
        return { success: true, role: userData.role, homePath: homeForUser(userData) };
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
    useWishlistStore.getState().clearAll();
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
    <AuthContext.Provider value={{ user, role, isLoading, login, register, logout, can: permission => canAccess(user, permission), homePath: homeForUser(user) }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
