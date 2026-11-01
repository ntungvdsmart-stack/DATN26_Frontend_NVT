import TableHeading from '../components/shared/TableHeading';
import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import ProductImage from '../components/shared/ProductImage';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Package, Search, Plus, Edit2, Eye, Lock, Unlock, Loader2, Trash2, ExternalLink } from 'lucide-react';
import productApi from '../api/productApi';
import { toast } from 'sonner';
import ProductForm from '../components/admin/ProductForm';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const ProductsList = () => {
  const { can } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  useEffect(() => { setSearchTerm(new URLSearchParams(location.search).get('search') || ''); }, [location.search]);
  
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
          toast.error(res?.message || 'Có lỗi xảy ra');
        }
      } catch (error) {
        toast.error(error.message || 'Lỗi kết nối');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Xóa vĩnh viễn "${name}" cùng biến thể, hình ảnh, tồn kho và mục giỏ hàng/yêu thích liên quan? Sản phẩm đã có lịch sử đơn hàng/đánh giá/đổi trả sẽ không được xóa; hãy dùng Ngừng bán.`)) {
      try {
        const res = await productApi.delete(id);
        if (res && res.success) {
          toast.success('Xóa sản phẩm thành công');
          fetchProducts();
        } else {
          toast.error(res?.message || 'Có lỗi xảy ra khi xóa');
        }
      } catch (error) {
        const canDeactivate = error.response?.data?.data?.can_deactivate && products.some(product => product.product_id === id && product.is_active);
        toast.error(error.message || 'Lỗi kết nối', { duration: 8000, ...(canDeactivate ? { action: { label: 'Ngừng bán', onClick: () => handleToggleStatus(id, true) } } : {}) });
      }
    }
  };

  const handleOpenEdit = (product) => {
    setEditProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditProduct(null), 300);
  };

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Staff: được thêm/sửa sản phẩm (nhập kho)
  // Admin: chỉ xem, bật/tắt trạng thái, xóa
  const canAddEdit = can('products.manage');

  const listPage = useListPagination(filteredProducts, searchTerm);

  return (
    <div className="p-1 sm:p-4 lg:p-6 space-y-5 sm:space-y-8 min-h-screen bg-background/50 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            {canAddEdit ? 'Nhập kho / Sản phẩm' : 'Quản lý Sản phẩm'}
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            {canAddEdit 
              ? 'Nhập hàng mới, cập nhật biến thể (SKU) và tồn kho theo chi nhánh' 
              : 'Xem danh sách sản phẩm, quản lý trạng thái bán hàng'}
          </p>
        </div>
        {canAddEdit && (
          <button 
            onClick={() => { setEditProduct(null); setIsFormOpen(true); }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            <Plus className="w-5 h-5" />
            Nhập sản phẩm mới
          </button>
        )}
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
        <TableHeading title={"S\u1ea3n ph\u1ea9m"} count={filteredProducts.length} loading={isLoading} />
        <div className="admin-table-scroll overflow-x-auto">
          <table className="admin-data-table table-with-actions w-full text-left border-collapse">
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
                listPage.items.map((p) => (
                  <tr key={p.product_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="p-4">
                        <ProductImage
                          src={p.primary_image} 
                          alt={p.product_name} 
                          className="w-12 h-12 object-cover rounded-lg border border-border/50" 
                        />
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
                      <div className="flex justify-end gap-2">
                        {/* Staff: Sửa / cập nhật tồn kho */}
                        {canAddEdit ? (
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Sửa / Cập nhật tồn kho">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        ) : (
                          /* Admin: Chỉ xem chi tiết */
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <a 
                          href={`/store/products/${p.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors" title="Xem trên web">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {canAddEdit && <button 
                          onClick={() => handleToggleStatus(p.product_id, p.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            p.is_active ? 'text-orange-500 hover:bg-orange-500/10' : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={p.is_active ? 'Ngừng bán' : 'Mở bán'}
                        >
                          {p.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>}
                        {canAddEdit && <button 
                          onClick={() => handleDelete(p.product_id, p.product_name)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Xóa vĩnh viễn">
                          <Trash2 className="w-4 h-4" />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && <div className="admin-table-footer"><Pagination {...listPage.paginationProps} /></div>}
      </div> 

      {/* Full-screen overlay cho Product Form */}
      <AnimatePresence>
        {isFormOpen && (
          <ModalLayer onClose={handleCloseForm} label="Sản phẩm"><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
            <div className="w-full max-w-6xl w-full">
              <ProductForm 
                editProduct={editProduct}
                onClose={handleCloseForm} 
                onSuccess={() => {
                  handleCloseForm();
                  fetchProducts();
                }}
                readOnly={!canAddEdit}
              />
            </div>
          </div></ModalLayer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsList;
