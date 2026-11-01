import ModalLayer from '../shared/ModalLayer';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import productApi from '../../api/productApi';

const QuickCreateModal = ({ type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', hex: '#000000' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const maxName = { category: 100, brand: 100, color: 50, size: 20, material: 100 }[type] || 100;

  const getTitle = () => {
    switch (type) {
      case 'category': return 'Thêm Danh mục';
      case 'brand': return 'Thêm Thương hiệu';
      case 'color': return 'Thêm Màu sắc';
      case 'size': return 'Thêm Kích cỡ';
      case 'material': return 'Thêm Chất liệu';
      default: return 'Thêm mới';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formData.name.trim() || formData.name.length > maxName) return setError(`Tên bắt buộc, tối đa ${maxName} ký tự`);
    if (type === 'color' && !/^#[a-fA-F0-9]{6}$/.test(formData.hex)) return setError('Mã màu phải có dạng #RRGGBB');
    setError('');
    setIsSaving(true);

    try {
      let res;
      switch (type) {
        case 'category':
          res = await productApi.createCategory({ category_name: formData.name.trim() });
          break;
        case 'brand':
          res = await productApi.createBrand({ brand_name: formData.name.trim() });
          break;
        case 'color':
          res = await productApi.createColor({ color_name: formData.name.trim(), hex_code: formData.hex });
          break;
        case 'size':
          res = await productApi.createSize({ size_value: formData.name.trim().toUpperCase() });
          break;
        case 'material':
          res = await productApi.createMaterial({ material_name: formData.name.trim() });
          break;
      }
      
      if (res?.success) {
        toast.success(`Đã thêm ${formData.name.trim()} thành công!`);
        onSuccess(type, res.data);
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalLayer onClose={onClose} label="Thêm thuộc tính"><div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="font-bold">{getTitle()}</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">
              Tên {type === 'size' ? '(S, M, 38, ...)' : type === 'color' ? 'Màu (Đen, Đỏ, ...)' : ''} *
            </label>
            <input 
              type="text" 
              autoFocus
              required 
              maxLength={maxName}
              aria-label="Tên thuộc tính"
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên..." 
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none"
            />
          </div>

          {type === 'color' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Mã màu (Tùy chọn)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={/^#[a-fA-F0-9]{6}$/.test(formData.hex) ? formData.hex : '#000000'}
                  onChange={e => setFormData(prev => ({ ...prev, hex: e.target.value }))}
                  className="w-10 h-10 p-1 border border-border rounded-lg cursor-pointer bg-background"
                />
                <input 
                  type="text" 
                  maxLength={7} pattern="#[a-fA-F0-9]{6}"
                  value={formData.hex} 
                  onChange={e => setFormData(prev => ({ ...prev, hex: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {isSaving ? 'Đang lưu...' : (
                <>
                  <Save className="w-4 h-4" /> Lưu
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div></ModalLayer>
  );
};

export default QuickCreateModal;
