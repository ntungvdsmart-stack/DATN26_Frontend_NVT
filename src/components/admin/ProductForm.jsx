import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Save, Trash2, Image as ImageIcon, Loader2, AlertCircle,
  Upload, Star, Link as LinkIcon, Tag, CheckCircle2
} from 'lucide-react';
import productApi from '../../api/productApi';

// ─── Ảnh 1 item (dùng lại cho list ảnh) ─────────────────────────────────────
const ImageCard = ({ img, index, onRemove, onSetPrimary, totalCount }) => {
  const isVideo = img.url?.match(/\.(mp4|webm)$/i);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
        img.is_primary ? 'border-primary shadow-lg shadow-primary/20' : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Preview */}
      <div className="aspect-square bg-muted">
        {img.url ? (
          isVideo
            ? <video src={img.url} className="w-full h-full object-cover" />
            : <img src={img.url} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" onError={e => { e.target.src = ''; e.target.className = 'hidden'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {img.uploading
              ? <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{img.progress}%</span>
                </div>
              : <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            }
          </div>
        )}
      </div>

      {/* Overlay actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!img.is_primary && (
          <button type="button" onClick={() => onSetPrimary(index)} title="Đặt làm ảnh đại diện"
            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
            <Star className="w-4 h-4" />
          </button>
        )}
        {totalCount > 1 && (
          <button type="button" onClick={() => onRemove(index)} title="Xóa ảnh"
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Badge gắn biến thể */}
      {img.variant_label && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] font-bold px-2 py-1 text-center truncate">
          🎨 {img.variant_label}
        </div>
      )}

      {/* Badge đại diện */}
      {img.is_primary && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-2.5 h-2.5 fill-current" /> Bìa
        </div>
      )}
    </motion.div>
  );
};

// ─── ProductForm ─────────────────────────────────────────────────────────────
const ProductForm = ({ onClose, onSuccess, editProduct = null }) => {
  const isEditMode = !!editProduct;
  const fileInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dữ liệu cho các dropdown
  const [attrs, setAttrs] = useState({ categories: [], brands: [], sizes: [], colors: [], materials: [] });

  // Thông tin cơ bản
  const [info, setInfo] = useState({
    product_name: '', category_id: '', brand_id: '',
    base_price: '', description: '', is_active: 1,
  });

  // Danh sách ảnh:
  // { url, filename, is_primary, variant_color_id, variant_label, uploading, progress }
  const [images, setImages] = useState([]);

  // Biến thể
  const [variants, setVariants] = useState([{
    sku: '', size_id: '', color_id: '', material_id: '', price: '', quantity: 0
  }]);

  // ── Load attributes & pre-fill edit data ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await productApi.getFormAttributes();
        if (res?.success) {
          setAttrs(res.data);
          if (!isEditMode && res.data.categories.length > 0) {
            setInfo(p => ({ ...p, category_id: res.data.categories[0].category_id }));
          }
        }
        if (isEditMode) {
          const detailRes = await productApi.getByIdAdmin(editProduct.product_id);
          if (detailRes?.success) {
            const p = detailRes.data;
            setInfo({
              product_name: p.product_name, category_id: p.category_id,
              brand_id: p.brand_id || '', base_price: p.base_price,
              description: p.description || '', is_active: p.is_active,
            });
            setImages((p.images || []).map(img => ({
              url: img.image_url, filename: '', is_primary: !!img.is_primary,
              variant_color_id: img.variant_id || '',
              variant_label: img.variant_id
                ? (p.variants?.find(v => v.variant_id === img.variant_id)?.color_name || 'Biến thể')
                : '',
              uploading: false, progress: 0,
            })));
            setVariants((p.variants || []).map(v => ({
              variant_id: v.variant_id, sku: v.sku,
              size_id: v.size_id || '', color_id: v.color_id || '',
              material_id: v.material_id || '', price: v.price,
              quantity: v.inventory_quantity || 0,
            })));
          }
        }
      } catch (err) {
        setErrorMsg('Không thể tải dữ liệu. Vui lòng thử lại.');
      }
      setIsFetchingData(false);
    })();
  }, [isEditMode, editProduct]);

  // ── Sync base_price → variants khi thay đổi ─────────────────────────────────
  const setInfoField = useCallback((key, value) => {
    setInfo(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'base_price') {
        const price = Number(value) || 0;
        setVariants(vs => vs.map(v => ({ ...v, price })));
      }
      return next;
    });
  }, []);

  // ── Handlers ảnh ─────────────────────────────────────────────────────────────

  // Upload file(s) từ máy
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);

    // Tạo placeholder entries trước
    const placeholders = fileArr.map(() => ({
      url: '', filename: '', is_primary: false,
      variant_color_id: '', variant_label: '',
      uploading: true, progress: 0,
    }));
    setImages(prev => {
      const next = [...prev, ...placeholders];
      // Nếu chưa có ảnh nào → ảnh đầu tiên là primary
      if (prev.length === 0) next[0].is_primary = true;
      return next;
    });

    const startIdx = images.length;
    try {
      const res = await productApi.uploadImages(fileArr, (percent) => {
        setImages(prev => {
          const next = [...prev];
          for (let i = 0; i < fileArr.length; i++) {
            if (next[startIdx + i]) next[startIdx + i].progress = percent;
          }
          return next;
        });
      });

      if (res?.success) {
        setImages(prev => {
          const next = [...prev];
          res.data.forEach((uploaded, i) => {
            if (next[startIdx + i]) {
              next[startIdx + i] = {
                ...next[startIdx + i],
                url: uploaded.url,
                filename: uploaded.filename,
                uploading: false, progress: 100,
              };
            }
          });
          return next;
        });
      } else {
        throw new Error(res?.message || 'Upload thất bại');
      }
    } catch (err) {
      // Xóa placeholder lỗi
      setImages(prev => prev.filter((_, i) => i < startIdx || i >= startIdx + fileArr.length));
      setErrorMsg(`Lỗi upload: ${err.message}`);
    }
  }, [images.length]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const removeImage = useCallback((index) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      // Nếu ảnh bị xóa là primary → tự đặt ảnh đầu làm primary
      if (prev[index]?.is_primary && next.length > 0) next[0].is_primary = true;
      return next;
    });
  }, []);

  const setPrimaryImage = useCallback((index) => {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === index })));
  }, []);

  // Gắn ảnh với biến thể màu cụ thể
  const setImageVariant = useCallback((imgIndex, colorId) => {
    setImages(prev => {
      const next = [...prev];
      const color = attrs.colors.find(c => String(c.color_id) === String(colorId));
      next[imgIndex] = {
        ...next[imgIndex],
        variant_color_id: colorId,
        variant_label: color?.color_name || '',
      };
      return next;
    });
  }, [attrs.colors]);

  // ── Handlers biến thể ────────────────────────────────────────────────────────
  const addVariant = useCallback(() => {
    setVariants(prev => [...prev, {
      sku: '', size_id: '', color_id: '', material_id: '',
      price: Number(info.base_price) || 0, quantity: 0,
    }]);
  }, [info.base_price]);

  const removeVariant = useCallback((index) => {
    setVariants(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const setVariantField = useCallback((index, field, value) => {
    setVariants(prev => {
      const next = [...prev];
      const numericFields = ['price', 'quantity', 'size_id', 'color_id', 'material_id'];
      next[index] = {
        ...next[index],
        [field]: numericFields.includes(field) ? (value !== '' ? Number(value) : '') : value,
      };
      return next;
    });
  }, []);

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    if (!info.product_name.trim()) return 'Vui lòng nhập tên sản phẩm';
    if (!info.category_id) return 'Vui lòng chọn danh mục';
    if (Number(info.base_price) <= 0) return 'Giá cơ bản phải lớn hơn 0';
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (Number(v.price) <= 0) return `Biến thể dòng ${i + 1}: Giá không hợp lệ`;
    }
    if (images.filter(img => img.url && !img.uploading).length === 0)
      return 'Vui lòng tải lên ít nhất 1 ảnh sản phẩm';
    return null;
  }, [info, variants, images]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setErrorMsg(err);
    if (images.some(i => i.uploading)) return setErrorMsg('Vui lòng chờ ảnh tải lên hoàn tất');

    setIsLoading(true);
    setErrorMsg('');

    // Tìm variant_id tương ứng color khi gắn ảnh
    const getVariantIdByColor = (colorId) => {
      if (!colorId) return null;
      const v = variants.find(v => String(v.color_id) === String(colorId) && v.variant_id);
      return v?.variant_id || null;
    };

    const payload = {
      product: {
        product_name: info.product_name.trim(),
        category_id: Number(info.category_id),
        brand_id: info.brand_id ? Number(info.brand_id) : null,
        base_price: Number(info.base_price),
        description: info.description.trim(),
        is_active: Number(info.is_active),
      },
      variants: variants.map(v => ({
        ...(v.variant_id && { variant_id: v.variant_id }),
        sku: v.sku.trim() || undefined,
        size_id: v.size_id || null,
        color_id: v.color_id || null,
        material_id: v.material_id || null,
        price: Number(v.price),
        quantity: Number(v.quantity) || 0,
      })),
      images: images
        .filter(img => img.url && !img.uploading)
        .map((img, i) => ({
          url: img.url,
          is_primary: img.is_primary,
          sort_order: i,
          variant_id: getVariantIdByColor(img.variant_color_id),
        })),
    };

    try {
      const res = isEditMode
        ? await productApi.update(editProduct.product_id, payload)
        : await productApi.create(payload);

      if (res?.success) {
        setSuccessMsg(isEditMode ? 'Cập nhật thành công!' : 'Tạo sản phẩm thành công!');
        setTimeout(() => onSuccess(), 800);
      } else {
        setErrorMsg(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối');
    }
    setIsLoading(false);
  }, [validate, images, variants, info, isEditMode, editProduct, onSuccess]);

  // ─── UI ─────────────────────────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm";
  const labelCls = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

  if (isFetchingData) return (
    <div className="flex flex-col items-center justify-center h-[50vh] bg-background rounded-2xl">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
      <p className="text-muted-foreground font-medium text-sm">Đang tải dữ liệu...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 64px)', maxHeight: 900 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0 bg-muted/30">
        <div>
          <h2 className="text-xl font-black tracking-tight">
            {isEditMode ? `Sửa: ${editProduct.product_name}` : 'Thêm Sản phẩm Mới'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Quản lý thông tin, biến thể và hình ảnh sản phẩm</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <form id="productForm" onSubmit={handleSubmit}>

          {/* Thông báo */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div key="ok" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── KHỐI 1: Thông tin cơ bản ── */}
          <section className="glass-panel rounded-xl p-5 space-y-4 mb-6">
            <h3 className="font-bold flex items-center gap-2 text-sm border-b border-border pb-3">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black">1</span>
              Thông tin chung
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Tên sản phẩm *</label>
                <input type="text" required value={info.product_name}
                  onChange={e => setInfoField('product_name', e.target.value)}
                  className={inputCls} placeholder="VD: Áo Polo Nam Slim Fit" />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Danh mục *</label>
                <select required value={info.category_id}
                  onChange={e => setInfoField('category_id', e.target.value)} className={inputCls}>
                  <option value="">-- Chọn danh mục --</option>
                  {attrs.categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.parent_name ? `${c.parent_name} › ${c.category_name}` : c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Thương hiệu</label>
                <select value={info.brand_id}
                  onChange={e => setInfoField('brand_id', e.target.value)} className={inputCls}>
                  <option value="">-- Không có --</option>
                  {attrs.brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Giá cơ bản (VNĐ) *</label>
                <input type="number" required min="1" value={info.base_price}
                  onChange={e => setInfoField('base_price', e.target.value)}
                  className={inputCls} placeholder="299000" />
              </div>

              <div className="space-y-1.5">
                <label className={labelCls}>Trạng thái</label>
                <select value={info.is_active}
                  onChange={e => setInfoField('is_active', Number(e.target.value))} className={inputCls}>
                  <option value={1}>✅ Đang bán</option>
                  <option value={0}>⛔ Nháp / Ngừng bán</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className={labelCls}>Mô tả sản phẩm</label>
                <textarea rows={3} value={info.description}
                  onChange={e => setInfoField('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="Mô tả chi tiết chất liệu, kiểu dáng, hướng dẫn sử dụng..." />
              </div>
            </div>
          </section>

          {/* ── KHỐI 2: Hình ảnh ── */}
          <section className="glass-panel rounded-xl p-5 space-y-4 mb-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black">2</span>
                Hình ảnh sản phẩm
                <span className="text-xs font-normal text-muted-foreground">({images.filter(i=>i.url).length} ảnh)</span>
              </h3>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Thêm ảnh
              </button>
            </div>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onDragEnter={e => e.target.classList.add('border-primary')}
              onDragLeave={e => e.target.classList.remove('border-primary')}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-bold text-sm mb-1">Kéo thả ảnh vào đây hoặc click để chọn</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — Tối đa 5MB/ảnh — Tối đa 10 ảnh cùng lúc</p>
              <input
                ref={fileInputRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple className="hidden"
                onChange={e => handleFileUpload(e.target.files)}
              />
            </div>

            {/* Grid ảnh */}
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  <AnimatePresence>
                    {images.map((img, i) => (
                      <div key={i} className="space-y-1.5">
                        <ImageCard
                          img={img} index={i}
                          onRemove={removeImage}
                          onSetPrimary={setPrimaryImage}
                          totalCount={images.length}
                        />
                        {/* Gắn màu cho ảnh biến thể */}
                        {img.url && !img.uploading && attrs.colors.length > 0 && (
                          <select
                            value={img.variant_color_id || ''}
                            onChange={e => setImageVariant(i, e.target.value)}
                            className="w-full text-[10px] px-1.5 py-1 border border-border rounded-lg bg-background outline-none focus:border-primary"
                            title="Gắn ảnh này với màu biến thể"
                          >
                            <option value="">🌐 Ảnh chung</option>
                            {attrs.colors
                              .filter(c => variants.some(v => String(v.color_id) === String(c.color_id)))
                              .map(c => (
                                <option key={c.color_id} value={c.color_id}>
                                  🎨 {c.color_name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⭐ <strong>Ảnh Bìa</strong> = ảnh đầu tiên, dùng để hiển thị ngoài danh sách.
                  🎨 <strong>Gắn màu</strong> = ảnh chỉ hiển thị khi khách chọn màu đó.
                  🌐 <strong>Ảnh chung</strong> = hiển thị với tất cả biến thể.
                </p>
              </div>
            )}
          </section>

          {/* ── KHỐI 3: Biến thể ── */}
          <section className="glass-panel rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black">3</span>
                Biến thể (SKU) & Tồn kho
                <span className="text-xs font-normal text-muted-foreground">({variants.length} biến thể)</span>
              </h3>
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Thêm biến thể
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    {['Màu sắc', 'Kích cỡ', 'Chất liệu', 'Mã SKU (Bỏ trống = Tự tạo)', 'Giá (VNĐ) *', 'Tồn kho', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {variants.map((v, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="px-2 py-2">
                        <select value={v.color_id}
                          onChange={e => setVariantField(idx, 'color_id', e.target.value)}
                          className="w-full py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs">
                          <option value="">- Màu -</option>
                          {attrs.colors.map(c => (
                            <option key={c.color_id} value={c.color_id}>{c.color_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={v.size_id}
                          onChange={e => setVariantField(idx, 'size_id', e.target.value)}
                          className="w-full py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs">
                          <option value="">- Size -</option>
                          {attrs.sizes.map(s => (
                            <option key={s.size_id} value={s.size_id}>{s.size_value}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select value={v.material_id}
                          onChange={e => setVariantField(idx, 'material_id', e.target.value)}
                          className="w-full py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs">
                          <option value="">- Chất liệu -</option>
                          {attrs.materials.map(m => (
                            <option key={m.material_id} value={m.material_id}>{m.material_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" placeholder="AUTO" value={v.sku}
                          onChange={e => setVariantField(idx, 'sku', e.target.value.toUpperCase())}
                          className="w-full py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary font-mono text-xs uppercase" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" required min="1" value={v.price}
                          onChange={e => setVariantField(idx, 'price', e.target.value)}
                          className="w-28 py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="number" min="0" value={v.quantity}
                          onChange={e => setVariantField(idx, 'quantity', e.target.value)}
                          className="w-20 py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => removeVariant(idx)}
                          disabled={variants.length <= 1}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              * Kho tổng (Chi nhánh ID=1) sẽ nhận số lượng tồn kho ban đầu này.
              Có thể điều chỉnh từng kho sau khi tạo xong.
            </p>
          </section>
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3 shrink-0">
        <button type="button" onClick={onClose}
          className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          Hủy
        </button>
        <button type="submit" form="productForm" disabled={isLoading || images.some(i => i.uploading)}
          className="bg-primary text-primary-foreground px-7 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditMode ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductForm;
