import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Search, Plus, Edit2, Trash2, Save, X, Loader2, Calendar } from 'lucide-react';
import promotionApi from '../api/promotionApi';
import { toast } from 'sonner';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    promo_code: '',
    promo_name: '',
    discount_type: 'percent',
    discount_value: '',
    channel_scope: 'both',
    min_order_amount: '0',
    max_usage_count: '',
    max_per_customer: '1',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await promotionApi.getAll();
      if (res && res.success) {
        setPromotions(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách khuyến mãi');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setFormData({
        ...item,
        start_date: new Date(item.start_date).toISOString().slice(0, 16),
        end_date: new Date(item.end_date).toISOString().slice(0, 16),
        max_usage_count: item.max_usage_count || '',
        is_active: item.is_active === 1 || item.is_active === true
      });
    } else {
      setFormData({
        promo_code: '',
        promo_name: '',
        discount_type: 'percent',
        discount_value: '',
        channel_scope: 'both',
        min_order_amount: '0',
        max_usage_count: '',
        max_per_customer: '1',
        start_date: '',
        end_date: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        promo_code: formData.promo_code.toUpperCase(),
        max_usage_count: formData.max_usage_count === '' ? null : Number(formData.max_usage_count),
        is_active: formData.is_active ? 1 : 0
      };

      if (editItem) {
        await promotionApi.update(editItem.promotion_id, payload);
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await promotionApi.create(payload);
        toast.success('Tạo mã giảm giá thành công');
      }
      fetchPromotions();
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || error?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    try {
      await promotionApi.delete(id);
      toast.success('Xóa thành công');
      fetchPromotions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const filteredPromotions = promotions.filter(p => 
    p.promo_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.promo_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-primary" />
            Khuyến mãi & Voucher
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Quản lý các chương trình giảm giá</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Tạo mã mới
        </button>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm theo mã hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Mã & Tên</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Mức giảm</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Điều kiện</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Thời gian</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Trạng thái</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground text-right">Thao tác</th>
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
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">Không tìm thấy mã giảm giá nào</td>
                </tr>
              ) : (
                filteredPromotions.map((item) => (
                  <tr key={item.promotion_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-mono font-black text-lg text-primary">{item.promo_code}</p>
                      <p className="font-medium text-sm text-muted-foreground line-clamp-1">{item.promo_name}</p>
                    </td>
                    <td className="p-4 font-bold">
                      {item.discount_type === 'percent' ? `${item.discount_value}%` : `${Number(item.discount_value).toLocaleString('vi-VN')}đ`}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      Đơn tối thiểu: {Number(item.min_order_amount).toLocaleString('vi-VN')}đ
                      <br/>Kênh: {item.channel_scope.toUpperCase()}
                    </td>
                    <td className="p-4 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Calendar size={12}/> Từ: {new Date(item.start_date).toLocaleString('vi-VN')}</div>
                      <div className="flex items-center gap-1.5 text-red-500"><Calendar size={12}/> Đến: {new Date(item.end_date).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-block">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(item.promotion_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors inline-block">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold">{editItem ? 'Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h2>
                <button type="button" onClick={closeModal} className="p-2 text-muted-foreground hover:bg-muted rounded-full"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="promoForm" onSubmit={handleSave} className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Mã giảm giá *</label>
                      <input type="text" required value={formData.promo_code} onChange={e => setFormData({...formData, promo_code: e.target.value.toUpperCase()})} placeholder="VD: SUMMER50" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary font-mono font-bold uppercase" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tên chương trình *</label>
                      <input type="text" required value={formData.promo_name} onChange={e => setFormData({...formData, promo_name: e.target.value})} placeholder="Sale Chào Hè" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Loại giảm giá</label>
                      <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary">
                        <option value="percent">Phần trăm (%)</option>
                        <option value="amount">Số tiền (VNĐ)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Giá trị giảm *</label>
                      <input type="number" required min="1" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} placeholder={formData.discount_type === 'percent' ? "10" : "50000"} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Đơn tối thiểu *</label>
                      <input type="number" required min="0" value={formData.min_order_amount} onChange={e => setFormData({...formData, min_order_amount: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Kênh áp dụng</label>
                      <select value={formData.channel_scope} onChange={e => setFormData({...formData, channel_scope: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary">
                        <option value="both">Tất cả (Online + POS)</option>
                        <option value="online">Chỉ Online</option>
                        <option value="pos">Chỉ POS (Tại quầy)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Tổng số lượt dùng (Trống = K/H)</label>
                      <input type="number" min="1" value={formData.max_usage_count} onChange={e => setFormData({...formData, max_usage_count: e.target.value})} placeholder="Không giới hạn" className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Số lần dùng/Khách hàng *</label>
                      <input type="number" required min="1" value={formData.max_per_customer} onChange={e => setFormData({...formData, max_per_customer: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Thời gian bắt đầu *</label>
                      <input type="datetime-local" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Thời gian kết thúc *</label>
                      <input type="datetime-local" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-4 border border-border rounded-lg bg-muted/20">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 accent-primary" />
                    <span className="font-bold">Kích hoạt mã giảm giá này</span>
                  </label>
                </form>
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-lg">Hủy</button>
                <button type="submit" form="promoForm" disabled={isSaving} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu Khuyến Mãi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PromotionManagement;
