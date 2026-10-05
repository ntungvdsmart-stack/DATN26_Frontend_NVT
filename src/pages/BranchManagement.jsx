import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, Edit2, Lock, Unlock, Loader2, MapPin, Phone } from 'lucide-react';
import branchApi from '../api/branchApi';
import { toast } from 'sonner';
import VietmapAutocomplete from '../components/common/VietmapAutocomplete';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    address: '',
    phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await branchApi.getAll();
      if (response && response.success) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách chi nhánh:', error);
      toast.error('Lỗi tải danh sách chi nhánh');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    // Chi nhánh 1 (Kho Tổng) thường không nên khóa, nhưng tuỳ logic. 
    // Tạm thời cho phép khóa, nhưng nếu là id=1 thì cảnh báo mạnh hơn.
    if (id === 1 && currentStatus) {
      if (!window.confirm('CẢNH BÁO: Kho Tổng đang hoạt động, bạn có chắc chắn muốn khóa Kho Tổng không? Điều này sẽ ảnh hưởng đến toàn bộ hệ thống!')) return;
    } else {
      if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? 'ngừng hoạt động' : 'mở lại'} chi nhánh này?`)) return;
    }

    try {
      const res = await branchApi.toggleStatus(id, !currentStatus);
      if (res && res.success) {
        toast.success(`Đã ${currentStatus ? 'khóa' : 'mở'} chi nhánh`);
        fetchBranches();
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi kết nối');
    }
  };

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditBranch(branch);
      setFormData({
        branch_name: branch.branch_name || '',
        address: branch.address || '',
        phone: branch.phone || ''
      });
    } else {
      setEditBranch(null);
      setFormData({ branch_name: '', address: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditBranch(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.branch_name.trim()) {
      toast.error('Tên chi nhánh là bắt buộc');
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editBranch) {
        res = await branchApi.update(editBranch.branch_id, formData);
      } else {
        res = await branchApi.create(formData);
      }

      if (res && res.success) {
        toast.success(editBranch ? 'Cập nhật chi nhánh thành công' : 'Thêm chi nhánh thành công');
        handleCloseModal();
        fetchBranches();
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.message || 'Lỗi kết nối');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            Quản lý Chi nhánh
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Quản lý danh sách kho hàng và cửa hàng chi nhánh</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Thêm Chi nhánh
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Chi nhánh</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Thông tin liên hệ</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-center">Trạng thái</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-muted-foreground font-medium">
                    Không tìm thấy chi nhánh nào.
                  </td>
                </tr>
              ) : (
                branches.map((b) => (
                  <tr key={b.branch_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="p-4 font-mono text-sm text-muted-foreground">#{b.branch_id}</td>
                    <td className="p-4">
                      <div className="font-bold text-foreground text-base flex items-center gap-2">
                        {b.branch_name}
                        {b.branch_id === 1 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest font-bold">
                            Kho Tổng
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      {b.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> 
                          <span className="line-clamp-2">{b.address}</span>
                        </div>
                      )}
                      {b.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 shrink-0" /> {b.phone}
                        </div>
                      )}
                      {!b.address && !b.phone && (
                        <span className="text-sm text-muted-foreground italic">Chưa cập nhật thông tin</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        b.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {b.is_active ? 'Hoạt động' : 'Ngừng h.động'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(b)}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(b.branch_id, b.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            b.is_active 
                              ? 'text-orange-500 hover:bg-orange-500/10' 
                              : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={b.is_active ? 'Khóa chi nhánh' : 'Mở khóa'}
                        >
                          {b.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border/50 bg-muted/30">
                <h2 className="text-xl font-bold tracking-tight">
                  {editBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
                </h2>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tên chi nhánh *</label>
                  <input 
                    type="text" required value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="VD: Chi nhánh 2 - Hà Nội"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Địa chỉ</label>
                  <VietmapAutocomplete 
                    value={formData.address}
                    onChange={(val) => setFormData({...formData, address: val})}
                    placeholder="Số nhà, Đường, Quận, Thành phố..."
                    className="bg-muted/50 focus:bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
                  <input 
                    type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Hotline chi nhánh"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-6">
                  <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 font-bold text-muted-foreground hover:text-foreground">
                    Hủy bỏ
                  </button>
                  <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {editBranch ? 'Lưu thay đổi' : 'Tạo chi nhánh'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BranchManagement;
