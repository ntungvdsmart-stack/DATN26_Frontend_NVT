import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, Grid, Plus, Edit2, Trash2, Save, X, Loader2, Ruler, Palette, Shirt } from 'lucide-react';
import { toast } from 'sonner';
import productApi from '../api/productApi';

const CategoryBrandManagement = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [data, setData] = useState({ categories: [], brands: [], sizes: [], colors: [], materials: [] });
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
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
    } catch (error) {
      console.error(error);
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
    setIsSaving(true);
    try {
      let res;
      if (activeTab === 'categories') {
        if (!formData.name.trim()) { setIsSaving(false); return; }
        const payload = { category_name: formData.name, parent_id: formData.parent_id || null };
        res = editItem ? await productApi.updateCategory(editItem.category_id, payload) : await productApi.createCategory(payload);
      } else if (activeTab === 'brands') {
        if (!formData.name.trim()) { setIsSaving(false); return; }
        const payload = { brand_name: formData.name };
        res = editItem ? await productApi.updateBrand(editItem.brand_id, payload) : await productApi.createBrand(payload);
      } else if (activeTab === 'sizes') {
        if (!formData.size_label.trim()) { setIsSaving(false); return; }
        const payload = { size_value: formData.size_label.trim() };
        res = editItem ? await productApi.updateSize(editItem.size_id, payload) : await productApi.createSize(payload);
      } else if (activeTab === 'colors') {
        if (!formData.color_name.trim()) { setIsSaving(false); return; }
        const payload = { color_name: formData.color_name, hex_code: formData.hex_code || null };
        res = editItem ? await productApi.updateColor(editItem.color_id, payload) : await productApi.createColor(payload);
      } else if (activeTab === 'materials') {
        if (!formData.material_name.trim()) { setIsSaving(false); return; }
        const payload = { material_name: formData.material_name };
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
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
    }
  };

  // ── Render bảng theo tab ──
  const renderTable = () => {
    if (activeTab === 'sizes') return renderSizesTable();
    if (activeTab === 'colors') return renderColorsTable();
    if (activeTab === 'materials') return renderMaterialsTable();
    return renderCatBrandTable();
  };

  const renderCatBrandTable = () => {
    const isCat = activeTab === 'categories';
    const list = isCat ? data.categories : data.brands;
    return (
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border/50">
              <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground w-20">ID</th>
              <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">{isCat ? 'Tên danh mục' : 'Tên thương hiệu'}</th>
              {isCat && <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Danh mục cha</th>}
              <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isCat ? 4 : 3} className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Đang tải...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={isCat ? 4 : 3} className="p-12 text-center text-muted-foreground">Chưa có dữ liệu</td></tr>
            ) : list.map((item) => (
              <tr key={isCat ? item.category_id : item.brand_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="p-4 font-mono text-sm text-muted-foreground">#{isCat ? item.category_id : item.brand_id}</td>
                <td className="p-4 font-bold">{isCat ? item.category_name : item.brand_name}</td>
                {isCat && <td className="p-4 text-sm text-muted-foreground">{item.parent_name ? <span className="px-2 py-1 bg-muted rounded-md">{item.parent_name}</span> : '-'}</td>}
                <td className="p-4 text-right">
                  <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(isCat ? item.category_id : item.brand_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSizesTable = () => (
    <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border/50">
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground w-20">ID</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Tên Size</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={3} className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Đang tải...</td></tr>
          ) : data.sizes.length === 0 ? (
            <tr><td colSpan={3} className="p-12 text-center text-muted-foreground">Chưa có Size nào.</td></tr>
          ) : data.sizes.map((item) => (
            <tr key={item.size_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-4 font-mono text-sm text-muted-foreground">#{item.size_id}</td>
              <td className="p-4"><span className="inline-block px-3 py-1 bg-primary/10 text-primary font-black text-sm rounded-lg">{item.size_value}</span></td>
              <td className="p-4 text-right">
                <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(item.size_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderColorsTable = () => (
    <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border/50">
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground w-20">ID</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Tên màu</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Mã màu (HEX)</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Xem trước</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Đang tải...</td></tr>
          ) : data.colors.length === 0 ? (
            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Chưa có màu nào.</td></tr>
          ) : data.colors.map((item) => (
            <tr key={item.color_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-4 font-mono text-sm text-muted-foreground">#{item.color_id}</td>
              <td className="p-4 font-bold">{item.color_name}</td>
              <td className="p-4 font-mono text-sm text-muted-foreground">{item.hex_code || '—'}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border border-border shadow-sm" style={{ backgroundColor: item.hex_code || '#ccc' }} />
                  <span className="text-xs text-muted-foreground">{item.color_name}</span>
                </div>
              </td>
              <td className="p-4 text-right">
                <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(item.color_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMaterialsTable = () => (
    <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border/50">
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground w-20">ID</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground">Tên chất liệu</th>
            <th className="p-4 font-bold text-sm uppercase tracking-wider text-muted-foreground text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={3} className="p-12 text-center text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Đang tải...</td></tr>
          ) : data.materials.length === 0 ? (
            <tr><td colSpan={3} className="p-12 text-center text-muted-foreground">Chưa có chất liệu nào.</td></tr>
          ) : data.materials.map((item) => (
            <tr key={item.material_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
              <td className="p-4 font-mono text-sm text-muted-foreground">#{item.material_id}</td>
              <td className="p-4 font-bold">{item.material_name}</td>
              <td className="p-4 text-right">
                <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors mr-2"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(item.material_id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ── Modal form fields ──
  const renderModalFields = () => {
    if (activeTab === 'categories') return (
      <>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Tên danh mục *</label>
          <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-muted-foreground">Danh mục cha</label>
          <select value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary">
            <option value="">-- Không có (Danh mục gốc) --</option>
            {data.categories.filter(c => c.category_id !== (editItem?.category_id || -1)).map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>
      </>
    );
    if (activeTab === 'brands') return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase text-muted-foreground">Tên thương hiệu *</label>
        <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
      </div>
    );
    if (activeTab === 'sizes') {
      return (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-muted-foreground">Tên Size *</label>
            <input type="text" required value={formData.size_label} onChange={e => setFormData({...formData, size_label: e.target.value.toUpperCase()})} placeholder="VD: S, M, L, XL, XXL, 38, 39..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary font-bold uppercase" />
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
          <input type="text" required value={formData.color_name} onChange={e => setFormData({...formData, color_name: e.target.value})} placeholder="VD: Đen, Trắng, Đỏ, Navy..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
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
        <input type="text" required value={formData.material_name} onChange={e => setFormData({...formData, material_name: e.target.value})} placeholder="VD: Cotton, Polyester, Lụa, Denim..." className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
      </div>
    );
    return null;
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
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
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {renderTable()}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryBrandManagement;
