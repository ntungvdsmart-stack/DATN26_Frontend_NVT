import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Shield, User, Lock, Unlock, Mail, Phone, Loader2 } from 'lucide-react';
import accountApi from '../api/accountApi';
import AccountModal from '../components/admin/AccountModal';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await accountApi.getAll();
      if (response && response.success) {
        setAccounts(response.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách tài khoản:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    if (window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      try {
        const res = await accountApi.toggleStatus(id, !currentStatus);
        if (res && res.success) {
          fetchAccounts();
        } else {
          alert(res?.message || 'Có lỗi xảy ra');
        }
      } catch (error) {
        alert(error.message || 'Lỗi kết nối');
      }
    }
  };

  const openModal = (account = null) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const closeModal = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    if (shouldRefresh) fetchAccounts();
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Quản lý Tài khoản Nội bộ
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Quản lý nhân viên (Staff) và quản trị viên (Admin)</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Tạo tài khoản
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email hoặc username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {/* Lọc Role tương lai ở đây */}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Nhân viên</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Username</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Liên hệ</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Vai trò</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground font-medium">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.account_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                          {acc.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{acc.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-muted-foreground">@{acc.username}</td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" /> {acc.email}
                      </div>
                      {acc.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" /> {acc.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        acc.role_id === 1 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {acc.role_id === 1 ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {acc.role_name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        acc.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${acc.is_active ? 'bg-green-500' : 'bg-zinc-500'}`} />
                        {acc.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(acc)}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(acc.account_id, acc.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            acc.is_active 
                              ? 'text-orange-500 hover:bg-orange-500/10' 
                              : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={acc.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {acc.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      <AnimatePresence>
        {isModalOpen && (
          <AccountModal 
            account={selectedAccount} 
            onClose={() => closeModal(false)} 
            onSuccess={() => closeModal(true)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountManagement;
