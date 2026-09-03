import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Shield, User, Loader2, AlertCircle } from 'lucide-react';
import accountApi from '../../api/accountApi';

const AccountModal = ({ account, onClose, onSuccess }) => {
  const isEdit = !!account;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role_id: 2 // Mặc định là Staff
  });

  useEffect(() => {
    if (account) {
      setFormData({
        username: account.username || '',
        full_name: account.full_name || '',
        email: account.email || '',
        phone: account.phone || '',
        password: '', // Không tải password lên
        role_id: account.role_id || 2
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'role_id' ? parseInt(value) : value }));
  };

  const validate = () => {
    if (!formData.full_name.trim()) return 'Vui lòng nhập họ và tên';
    if (!isEdit && !formData.username.trim()) return 'Vui lòng nhập tên đăng nhập';
    if (!isEdit && !formData.email.trim()) return 'Vui lòng nhập email';
    if (!isEdit && (!formData.password || formData.password.length < 6)) return 'Mật khẩu phải từ 6 ký tự';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setErrorMsg(error);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      let res;
      if (isEdit) {
        // Cập nhật (Không gửi password, username, email để bảo vệ)
        const updateData = {
          full_name: formData.full_name,
          phone: formData.phone,
          role_id: formData.role_id
        };
        res = await accountApi.update(account.account_id, updateData);
      } else {
        // Tạo mới
        res = await accountApi.create(formData);
      }

      if (res && res.success) {
        onSuccess(); // Đóng modal và tải lại list
      } else {
        setErrorMsg(res?.message || 'Có lỗi xảy ra từ máy chủ');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isEdit ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit ? `Đang chỉnh sửa nhân viên: ${account.full_name}` : 'Thêm nhân viên hoặc quản trị viên vào hệ thống'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form id="accountForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Vai trò */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vai trò (Role)</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.role_id === 1 ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}>
                  <input type="radio" name="role_id" value={1} checked={formData.role_id === 1} onChange={handleChange} className="hidden" />
                  <Shield className="w-5 h-5" />
                  <div className="font-bold text-sm">Quản trị viên (Admin)</div>
                </label>
                <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.role_id === 2 ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}>
                  <input type="radio" name="role_id" value={2} checked={formData.role_id === 2} onChange={handleChange} className="hidden" />
                  <User className="w-5 h-5" />
                  <div className="font-bold text-sm">Nhân viên (Staff)</div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Họ và tên *</label>
                <input 
                  type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
                <input 
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Không bắt buộc"
                />
              </div>
            </div>

            {/* Các trường không thể sửa khi đã tạo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username {isEdit ? '(Không thể sửa)' : '*'}</label>
                <input 
                  type="text" name="username" required={!isEdit} disabled={isEdit} value={formData.username} onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none transition-all ${isEdit ? 'opacity-50 cursor-not-allowed bg-muted/50' : 'focus:border-primary focus:ring-1 focus:ring-primary'}`}
                  placeholder="Tên đăng nhập"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email {isEdit ? '(Không thể sửa)' : '*'}</label>
                <input 
                  type="email" name="email" required={!isEdit} disabled={isEdit} value={formData.email} onChange={handleChange}
                  className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none transition-all ${isEdit ? 'opacity-50 cursor-not-allowed bg-muted/50' : 'focus:border-primary focus:ring-1 focus:ring-primary'}`}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mật khẩu khởi tạo *</label>
                <input 
                  type="password" name="password" required={!isEdit} minLength={6} value={formData.password} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                />
                <p className="text-xs text-muted-foreground">Nhân viên sẽ sử dụng mật khẩu này để đăng nhập lần đầu tiên.</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-muted/10 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            form="accountForm"
            disabled={isLoading}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountModal;
