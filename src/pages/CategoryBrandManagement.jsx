import AdminDataTable from '../components/shared/AdminDataTable';
import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, Grid, Plus, Edit2, Trash2, Save, X, Loader2, Ruler, Palette, Shirt, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import productApi from '../api/productApi';
import ProductImage from '../components/shared/ProductImage';

const CategoryBrandManagement = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [data, setData] = useState({ categories: [], brands: [], sizes: [], colors: [], materials: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', parent_id: '',
    size_label: '', size_desc: '',
    color_name: '', hex_code: '',
    material_name: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true); setLoadError('');
    try {
      const res = await productApi.getAttributes();
      if (res && res.success) {
        setData({
          categories: res.data.categories || [],
          brands: res.data.brands || [],
          sizes: res.data.sizes || [],
          colors: res.data.colors || [],
          materials: res.data.materials || []
        });
      }
    } catch {
      setLoadError('Không tải được dữ liệu. Vui lòng thử lại.');
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);


  const tabConfig = {
    categories: { label: 'Danh mục', icon: Grid },
    brands:     { label: 'Thương hiệu', icon: Tags },
    sizes:      { label: 'Size', icon: Ruler },
    colors:     { label: 'Màu sắc', icon: Palette },
    materials:  { label: 'Chất liệu', icon: Shirt },
  };

  const openModal = (item = null) => {
    setEditItem(item);
    const base = { name: '', parent_id: '', size_label: '', size_desc: '', color_name: '', hex_code: '', material_name: '' };
    if (activeTab === 'categories') {
      base.name = item ? item.category_name : '';
      base.parent_id = item ? (item.parent_id || '') : '';
      base.image_url = item?.image_url || '';
      base.is_featured = Boolean(item?.is_featured);
      base.display_order = item?.display_order || 0;
    } else if (activeTab === 'brands') {
      base.name = item ? item.brand_name : '';
    } else if (activeTab === 'sizes') {
      base.size_label = item ? item.size_value : '';
    } else if (activeTab === 'colors') {
      base.color_name = item ? item.color_name : '';
      base.hex_code = item ? (item.hex_code || '') : '#000000';
    } else if (activeTab === 'materials') {
      base.material_name = item ? item.material_name : '';
    }
    setFormData(base);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditItem(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      let res;
      if (activeTab === 'categories') {
        if (!formData.name.trim()) { toast.error('Vui lòng nhập tên danh mục'); setIsSaving(false); return; }
        const payload = { category_name: formData.name.trim(), parent_id: formData.parent_id || null, image_url: formData.image_url?.trim() || null, is_featured: Boolean(formData.is_featured), display_order: Number(formData.display_order || 0) };
        if (payload.is_featured && !payload.image_url) { toast.error('Hãy thêm ảnh cho danh mục nổi bật'); return; }
        res = editItem ? await productApi.updateCategory(editItem.category_id, payload) : await productApi.createCategory(payload);
      } else if (activeTab === 'brands') {
        if (!formData.name.trim()) { toast.error('Vui lòng nhập tên thương hiệu'); setIsSaving(false); return; }
        const payload = { brand_name: formData.name.trim() };
        res = editItem ? await productApi.updateBrand(editItem.brand_id, payload) : await productApi.createBrand(payload);
      } else if (activeTab === 'sizes') {
        if (!formData.size_label.trim()) { toast.error('Vui lòng nhập kích cỡ size'); setIsSaving(false); return; }
        const payload = { size_value: formData.size_label.trim() };
        res = editItem ? await productApi.updateSize(editItem.size_id, payload) : await productApi.createSize(payload);
      } else if (activeTab === 'colors') {
        if (!formData.color_name.trim()) { toast.error('Vui lòng nhập tên màu sắc'); setIsSaving(false); return; }
        const payload = { color_name: formData.color_name.trim(), hex_code: formData.hex_code || null };
        res = editItem ? await productApi.updateColor(editItem.color_id, payload) : await productApi.createColor(payload);
      } else if (activeTab === 'materials') {
        if (!formData.material_name.trim()) { toast.error('Vui lòng nhập tên chất liệu'); setIsSaving(false); return; }
        const payload = { material_name: formData.material_name.trim() };
        res = editItem ? await productApi.updateMaterial(editItem.material_id, payload) : await productApi.createMaterial(payload);
      }
      if (res && res.success) {
        toast.success(editItem ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        fetchData();
        closeModal();
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (isDeleting) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    setIsDeleting(true);
    try {
      let res;
      if (activeTab === 'categories') res = await productApi.deleteCategory(id);
      else if (activeTab === 'brands') res = await productApi.deleteBrand(id);
      else if (activeTab === 'sizes') res = await productApi.deleteSize(id);
      else if (activeTab === 'colors') res = await productApi.deleteColor(id);
      else if (activeTab === 'materials') res = await productApi.deleteMaterial(id);
      
      if (res && res.success) {
        toast.success('Xóa thành công!');
        fetchData();
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalize = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const idField = { categories: 'category_id', brands: 'brand_id', sizes: 'size_id', colors: 'color_id', materials: 'material_id' }[activeTab];
  const nameField = { categories: 'category_name', brands: 'brand_name', sizes: 'size_value', colors: 'color_name', materials: 'material_name' }[activeTab];
  const filteredRows = (data[activeTab] || []).filter(row => normalize(`${row[nameField]} ${row.parent_name || ''} ${row.hex_code || ''}`).includes(normalize(search.trim())));
  const listPage = useListPagination(filteredRows, `${activeTab}:${search}`);
  const columns = [
    { key: 'id', label: 'Mã', className: 'table-id', render: row => <span className="table-id-tag">#{row[idField]}</span> },
    { key: 'name', label: tabConfig[activeTab].label, render: row => <div className="flex items-center gap-3"><span className="table-record-icon">{activeTab === 'colors' ? <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: row.hex_code || '#ccc' }} /> : (() => { const Icon = tabConfig[activeTab].icon; return <Icon size={17} strokeWidth={1.6} />; })()}</span><span className="font-medium break-words">{row[nameField]}</span></div> },
    ...(activeTab === 'categories' ? [{ key: 'parent', label: 'Danh mục cha', render: row => row.parent_name ? <span className="table-neutral-badge">{row.parent_name}</span> : <span className="text-xs text-muted-foreground">Danh mục gốc</span> }] : []),
    ...(activeTab === 'categories' ? [{ key: 'featured', label: 'Trang chủ', render: row => row.is_featured ? <span className="table-neutral-badge">Nổi bật · Thứ tự {row.display_order}</span> : <span className="text-xs text-muted-foreground">Ẩn</span> }] : []),
    ...(activeTab === 'colors' ? [{ key: 'hex_code', label: 'Mã màu', render: row => <code className="table-neutral-badge">{row.hex_code || '-' }</code> }] : []),
    { key: 'actions', label: 'Thao tác', className: 'table-actions', render: row => <div className="flex justify-end gap-2"><button type="button" onClick={() => openModal(row)} className="table-edit" aria-label={`Sửa ${row[nameField]}`} title="Chỉnh sửa"><Edit2 size={15} /><span>Sửa</span></button><button type="button" disabled={isDeleting} onClick={() => handleDelete(row[idField])} className="table-delete" aria-label={`Xóa ${row[nameField]}`} title="Xóa"><Trash2 size={15} /></button></div> }
  ];

  // ── Modal form fields ──
  const renderModalFields = () => {
    if (activeTab === 'categories') return (
      <>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Tên danh mục *</label>
          <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Danh mục cha</label>
          <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary">
            <option value="">-- Không có (Danh mục gốc) --</option>
            {data.categories.filter(category => {
              const visited = new Set();
              let current = category;
              while (current) {
                if (current.category_id === editItem?.category_id || visited.has(current.category_id)) return false;
                visited.add(current.category_id);
                current = data.categories.find(parent => parent.category_id === current.parent_id);
              }
              return true;
            }).map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={Boolean(formData.is_featured)} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />Hiển thị trong Danh mục nổi bật trên trang chủ</label>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="category-image">URL ảnh danh mục</label>
          <input id="category-image" type="url" maxLength={1000} required={Boolean(formData.is_featured)} placeholder="https://..." value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg" />
          {formData.image_url && <ProductImage src={formData.image_url} alt="Xem trước ảnh danh mục" className="w-24 aspect-[3/4] object-cover rounded-lg border border-border" />}
        </div>
        <div className="space-y-2">
          <label htmlFor="category-order" className="text-sm font-medium">Thứ tự hiển thị (số nhỏ đứng trước)</label>
          <input id="category-order" type="number" min={0} max={9999} step={1} required value={formData.display_order ?? 0} onChange={e => setFormData({...formData, display_order: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg" />
        </div>
      </>
    );
    if (activeTab === 'brands') return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-muted-foreground">Tên thương hiệu *</label>
        <input type="text" required maxLength={100} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
      </div>
    );
    if (activeTab === 'sizes') {
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Tên Size *</label>
            <input type="text" required maxLength={20} value={formData.size_label} onChange={e => setFormData({...formData, size_label: e.target.value.toUpperCase()})} placeholder="VD: S, M, L, XL, XXL, 38, 39..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary font-bold uppercase" />
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-700">💡 <strong>Mô tả cân nặng / chiều cao</strong> sẽ nhập riêng cho từng sản phẩm khi tạo biến thể (vì áo, quần, giày có mô tả size khác nhau).</p>
          </div>
        </>
      );
    }
    if (activeTab === 'colors') return (
      <>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Tên màu *</label>
          <input type="text" required maxLength={50} value={formData.color_name} onChange={e => setFormData({...formData, color_name: e.target.value})} placeholder="VD: Đen, Trắng, Đỏ, Navy..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Mã màu HEX</label>
          <div className="flex items-center gap-3">
            <input type="color" value={formData.hex_code || '#000000'} onChange={e => setFormData({...formData, hex_code: e.target.value})} className="w-12 h-10 rounded-lg border border-border cursor-pointer" />
            <input type="text" value={formData.hex_code} onChange={e => setFormData({...formData, hex_code: e.target.value})} placeholder="#000000" maxLength={7} className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary font-mono uppercase" />
          </div>
          <p className="text-[11px] text-muted-foreground">Bấm ô vuông bên trái để chọn màu trực quan, hoặc nhập tay mã HEX.</p>
        </div>
        {/* Preview */}
        {formData.color_name && (
          <div className="p-3 bg-muted/30 border border-border rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border-2 border-border shadow-sm" style={{ backgroundColor: formData.hex_code || '#ccc' }} />
            <div>
              <p className="font-bold text-sm">{formData.color_name}</p>
              <p className="text-xs text-muted-foreground font-mono">{formData.hex_code}</p>
            </div>
          </div>
        )}
      </>
    );
    if (activeTab === 'materials') return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-muted-foreground">Tên chất liệu *</label>
        <input type="text" required maxLength={100} value={formData.material_name} onChange={e => setFormData({...formData, material_name: e.target.value})} placeholder="VD: Cotton, Polyester, Lụa, Denim..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
      </div>
    );
    return null;
  };

  return (
    <div className="p-1 sm:p-4 lg:p-6 space-y-5 sm:space-y-8 min-h-screen bg-background/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Tags className="w-8 h-8 text-primary" />
            Thuộc tính sản phẩm
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Quản lý Danh mục, Thương hiệu, Size, Màu sắc, Chất liệu</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
          <Plus className="w-5 h-5" />
          Thêm {tabConfig[activeTab].label}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 w-fit rounded-xl border border-border flex-wrap">
        {Object.entries(tabConfig).map(([key, { label, icon: Icon }]) => (
          <button key={key} onClick={() => { setActiveTab(key); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <section className="admin-table-panel">
        <div className="admin-table-toolbar"><div><h2 className="font-semibold text-sm">{tabConfig[activeTab].label}</h2><p className="text-xs text-muted-foreground mt-1">{filteredRows.length} / {(data[activeTab] || []).length} bản ghi</p></div><div className="flex items-center gap-2 w-full sm:w-auto"><label className="relative block flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm thuộc tính" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên..." maxLength={150} className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg" /></label><button type="button" disabled={isLoading} onClick={fetchData} aria-label="Tải lại" className="table-icon-button"><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></button></div></div>
        {loadError ? <div role="alert" className="p-8 text-center text-sm text-destructive">{loadError}<button onClick={fetchData} className="block mx-auto mt-3 underline">Thử lại</button></div> : <AdminDataTable columns={columns} rows={listPage.items} rowKey={row => row[idField]} loading={isLoading} caption={tabConfig[activeTab].label} emptyMessage={search ? 'Không có kết quả phù hợp' : 'Chưa có dữ liệu'} />}
        {!isLoading && !loadError && filteredRows.length > 0 && <div className="admin-table-footer"><Pagination {...listPage.paginationProps} /></div>}
      </section>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalLayer onClose={closeModal} label="Danh mục và thuộc tính"><div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold">{editItem ? 'Chỉnh sửa' : 'Thêm mới'} {tabConfig[activeTab].label}</h2>
                <button onClick={closeModal} className="p-2 text-muted-foreground hover:bg-muted rounded-full"><X size={18} /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {renderModalFields()}
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-lg">Hủy</button>
                  <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu
                  </button>
                </div>
              </form>
            </motion.div>
          </div></ModalLayer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryBrandManagement;
