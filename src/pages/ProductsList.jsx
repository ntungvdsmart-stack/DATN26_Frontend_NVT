import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Plus, Edit2, ShieldAlert, Eye, Lock, Unlock, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import productApi from '../api/productApi';
import ProductForm from '../components/admin/ProductForm';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer/Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.getAllAdmin();
      if (response && response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách sản phẩm:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    if (window.confirm(`Bạn có chắc muốn ${currentStatus ? 'ngừng bán' : 'mở bán lại'} sản phẩm này?`)) {
      try {
        const res = await productApi.toggleStatus(id, !currentStatus);
        if (res && res.success) {
          fetchProducts();
        } else {
          alert(res?.message || 'Có lỗi xảy ra');
        }
      } catch (error) {
        alert(error.message || 'Lỗi kết nối');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`CẢNH BÁO: Xóa sản phẩm "${name}" sẽ xóa TOÀN BỘ biến thể, hình ảnh và tồn kho liên quan. Bạn có chắc chắn?`)) {
      try {
        const res = await productApi.delete(id);
        if (res && res.success) {
          fetchProducts();
        } else {
          alert(res?.message || 'Có lỗi xảy ra khi xóa');
        }
      } catch (error) {
        alert(error.message || 'Lỗi kết nối');
      }
    }
  };

  const handleOpenEdit = (product) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditProduct(null), 300); // Đợi animation đóng xong mới clear data
  };

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Quản lý Sản phẩm
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Danh mục sản phẩm, biến thể (SKU) và tồn kho tổng</p>
        </div>
        <button 
          onClick={() => { setEditProduct(null); setIsFormOpen(true); }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
        >
          <Plus className="w-5 h-5" />
          Thêm Sản phẩm
        </button>
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground w-16">Ảnh</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Sản phẩm</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Danh mục</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Giá cơ bản</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-center">SKU / Tồn kho</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-muted-foreground font-medium">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.product_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                      {p.primary_image ? (
                        <img src={p.primary_image} alt={p.product_name} className="w-12 h-12 object-cover rounded-lg border border-border/50" onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=L%E1%BB%97i'; }} />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground line-clamp-2 max-w-[300px]">{p.product_name}</div>
                      {p.brand_name && <div className="text-xs text-muted-foreground mt-1">Thương hiệu: {p.brand_name}</div>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
                        {p.category_name || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.base_price)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20">
                          {p.total_variants} SKU
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          Kho: {p.total_inventory}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.is_active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {p.is_active ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(p.product_id, p.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            p.is_active ? 'text-orange-500 hover:bg-orange-500/10' : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={p.is_active ? 'Ngừng bán' : 'Mở bán'}
                        >
                          {p.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.product_id, p.product_name)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Xóa vĩnh viễn">
                          <Trash2 className="w-4 h-4" />
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

      {/* Full-screen overlay cho Product Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
            <div className="w-full max-w-6xl w-full">
              <ProductForm 
                editProduct={editProduct}
                onClose={handleCloseForm} 
                onSuccess={() => {
                  handleCloseForm();
                  fetchProducts();
                }} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsList;
