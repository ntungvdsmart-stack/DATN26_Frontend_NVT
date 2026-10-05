import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Save, Trash2, Image as ImageIcon, Loader2, AlertCircle,
  Upload, Star, Link as LinkIcon, Tag, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import productApi from '../../api/productApi';
import QuickCreateModal from './QuickCreateModal';

// ─── Ảnh 1 item (dùng lại cho list ảnh) ─────────────────────────────────────
const ImageCard = ({ img, index, onRemove, onSetPrimary }) => {
  const [isBroken, setIsBroken] = useState(false);
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
        {img.url && !isBroken ? (
          isVideo
            ? <video src={img.url} className="w-full h-full object-cover" />
            : <img src={img.url} alt={`Ảnh ${index + 1}`} className="w-full h-full object-cover" onError={() => setIsBroken(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {img.uploading
              ? <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">{img.progress}%</span>
                </div>
              : isBroken 
                ? <div className="flex flex-col items-center gap-2 text-red-400">
                    <AlertCircle className="w-10 h-10" />
                    <span className="text-[10px] font-semibold">Ảnh không khả dụng</span>
                  </div>
                : <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            }
          </div>
        )}
      </div>

      {/* Overlay actions — luôn hiện nút Xóa để có thể xóa hết ảnh cũ */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!img.is_primary && (
          <button type="button" onClick={() => onSetPrimary(index)} title="Đặt làm ảnh đại diện"
            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
            <Star className="w-4 h-4" />
          </button>
        )}
        <button type="button" onClick={() => onRemove(index)} title="Xóa ảnh"
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
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
  const sizeGuideInputRef = useRef(null);
  const [sizeGuideFile, setSizeGuideFile] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dữ liệu cho các dropdown
  const [attrs, setAttrs] = useState({ categories: [], brands: [], sizes: [], colors: [], materials: [] });

  // Thông tin cơ bản
  const [info, setInfo] = useState({
    product_name: '', category_id: '', brand_id: '',
    base_price: '', description: '', is_active: 1, size_guide_image_url: ''
  });

  // Danh sách ảnh:
  // { url, filename, is_primary, variant_color_id, variant_label, uploading, progress }
  const [images, setImages] = useState([]);

  // Biến thể
  const [variants, setVariants] = useState([{
    sku: '', size_id: '', size_description: '', color_id: '', material_id: '', price: '', quantity: 0
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
              size_guide_image_url: p.size_guide_image_url || ''
            });
            setImages((p.images || []).map(img => {
              // Tìm color_id thật từ variant_id (vì dropdown ảnh dùng color_id, không phải variant_id)
              const matchedVariant = img.variant_id
                ? p.variants?.find(v => v.variant_id === img.variant_id)
                : null;
              return {
                url: img.image_url, filename: '', is_primary: !!img.is_primary,
                variant_color_id: matchedVariant?.color_id ? String(matchedVariant.color_id) : '',
                variant_label: matchedVariant?.color_name || '',
                uploading: false, progress: 0,
              };
            }));
            setVariants((p.variants || []).map(v => ({
              variant_id: v.variant_id, sku: v.sku,
              size_id: v.size_id || '', size_description: v.size_description || '',
              color_id: v.color_id || '',
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

  const [quickCreateType, setQuickCreateType] = useState(null);

  const handleQuickCreateSuccess = (type, data) => {
    switch (type) {
      case 'category':
        setAttrs(prev => ({ ...prev, categories: [...prev.categories, data] }));
        setInfoField('category_id', data.category_id);
        break;
      case 'brand':
        setAttrs(prev => ({ ...prev, brands: [...prev.brands, data] }));
        setInfoField('brand_id', data.brand_id);
        break;
      case 'color':
        setAttrs(prev => ({ ...prev, colors: [...prev.colors, data] }));
        break;
      case 'size':
        setAttrs(prev => ({ ...prev, sizes: [...prev.sizes, data] }));
        break;
      case 'material':
        setAttrs(prev => ({ ...prev, materials: [...prev.materials, data] }));
        break;
    }
    setQuickCreateType(null);
  };

  // Đã chuyển sang QuickCreateModal thay cho alert/prompt

  // ── Handlers ảnh ─────────────────────────────────────────────────────────────

  // Chọn file từ máy (chưa upload vội, chỉ preview)
  const handleFileUpload = useCallback((files) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);

    // Reset input file để có thể chọn lại cùng file
    if (fileInputRef.current) fileInputRef.current.value = '';

    const newImages = fileArr.map((file) => ({
      file: file, // Giữ lại raw File để upload khi Submit
      url: URL.createObjectURL(file), // Tạo URL preview local
      filename: file.name,
      is_primary: false,
      variant_color_id: '',
      variant_label: '',
      uploading: false,
      progress: 100,
    }));

    setImages(prev => {
      const next = [...prev, ...newImages];
      // Nếu chưa có ảnh nào → ảnh đầu tiên là primary
      if (prev.length === 0 && next.length > 0) next[0].is_primary = true;
      return next;
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleUrlUpload = useCallback(async () => {
    const url = window.prompt('Nhập đường dẫn (URL) ảnh:');
    if (!url || !url.trim()) return;

    // Dùng uploadId để tránh stale closure (giống handleFileUpload)
    const uploadId = `url-${Date.now()}-${Math.random()}`;
    setImages(prev => [...prev, {
      url: '', filename: 'url-image', is_primary: prev.length === 0,
      variant_color_id: '', variant_label: '', uploading: true, progress: 50,
      _uploadId: uploadId,
    }]);

    try {
      const res = await productApi.uploadImageUrl(url.trim());
      if (res?.success && res.data?.length > 0) {
        setImages(prev => prev.map(img => {
          if (img._uploadId === uploadId) {
            return {
              ...img,
              url: res.data[0].url,
              filename: res.data[0].filename,
              uploading: false, progress: 100,
              _uploadId: undefined,
            };
          }
          return img;
        }));
        toast.success('Đã tải ảnh từ web về Cloudinary!');
      } else {
        throw new Error('Lỗi upload từ web');
      }
    } catch (err) {
      setImages(prev => prev.filter(img => img._uploadId !== uploadId));
      toast.error('Đường dẫn ảnh không hợp lệ hoặc web chặn tải xuống.');
    }
  }, []);

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
      sku: '', size_id: '', size_description: '', color_id: '', material_id: '',
      price: Number(info.base_price) || 0, quantity: 0
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

    try {
      // 1. Upload các file ảnh cục bộ (trước khi lưu)
      const filesToUpload = images.filter(img => img.file);
      let uploadedUrls = [];
      
      if (filesToUpload.length > 0) {
        toast.loading('Đang tải ảnh lên...', { id: 'upload-toast' });
        const rawFiles = filesToUpload.map(img => img.file);
        
        const uploadRes = await productApi.uploadImages(rawFiles, (percent) => {});
        if (!uploadRes?.success) throw new Error(uploadRes?.message || 'Lỗi upload ảnh');
        
        uploadedUrls = uploadRes.data;
        toast.dismiss('upload-toast');
      }

      // 2. Cập nhật lại danh sách images với URL thật từ server
      let uploadIndex = 0;
      const finalImages = images.map(img => {
        if (img.file) {
          const uploadedInfo = uploadedUrls[uploadIndex++] || uploadedUrls[0] || {
            url: 'https://placehold.co/400x500/f3f4f6/9ca3af?text=Lỗi+Tài+Khoản',
            filename: `fallback-${Date.now()}`
          };
          return {
            ...img,
            url: uploadedInfo.url,
            filename: uploadedInfo.filename,
          };
        }
        return img;
      });

      // Tìm variant_id tương ứng color khi gắn ảnh
      const getVariantIdByColor = (colorId) => {
        if (!colorId) return null;
        const v = variants.find(v => String(v.color_id) === String(colorId) && v.variant_id);
        return v?.variant_id || null;
      };

      let finalSizeGuideUrl = info.size_guide_image_url;
      if (sizeGuideFile) {
        toast.loading('Đang tải ảnh bảng size lên...', { id: 'upload-sg-toast' });
        const sgUploadRes = await productApi.uploadImages([sizeGuideFile], (percent) => {});
        if (!sgUploadRes?.success) throw new Error(sgUploadRes?.message || 'Lỗi upload ảnh bảng size');
        finalSizeGuideUrl = sgUploadRes.data[0].url;
        toast.dismiss('upload-sg-toast');
      }

      const payload = {
        product: {
          product_name: info.product_name.trim(),
          category_id: Number(info.category_id),
          brand_id: info.brand_id ? Number(info.brand_id) : null,
          base_price: Number(info.base_price),
          description: info.description.trim(),
          is_active: Number(info.is_active),
          size_guide_image_url: finalSizeGuideUrl?.trim() || null,
        },
        variants: variants.map(v => ({
          ...(v.variant_id && { variant_id: v.variant_id }),
          sku: v.sku.trim() || undefined,
          size_id: v.size_id || null,
          size_description: v.size_description?.trim() || null,
          color_id: v.color_id || null,
          material_id: v.material_id || null,
          price: Number(v.price),
          quantity: Number(v.quantity) || 0,
        })),
        images: finalImages
          .filter(img => img.url && !img.uploading)
          .map((img, i) => ({
            url: img.url,
            is_primary: img.is_primary,
            sort_order: i,
            color_id: img.variant_color_id || null,
            variant_id: getVariantIdByColor(img.variant_color_id),
          })),
      };

      const res = isEditMode
        ? await productApi.update(editProduct.product_id, payload)
        : await productApi.create(payload);

      if (res.success) {
        toast.success(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
        onSuccess();
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.dismiss('upload-toast');
      toast.error(error.response?.data?.message || error.message || 'Lỗi hệ thống');
    } finally {
      setIsLoading(false);
    }
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
    <div>
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
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Danh mục *</label>
                    <button type="button" onClick={() => setQuickCreateType('category')}
                      className="ml-2 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Mới
                    </button>
                </div>
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
                <div className="flex justify-between items-center">
                  <label className={labelCls}>Thương hiệu</label>
                    <button type="button" onClick={() => setQuickCreateType('brand')}
                      className="ml-2 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Mới
                    </button>
                </div>
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

              <div className="md:col-span-2 space-y-2 mt-2">
                <label className={labelCls}>Ảnh Hướng dẫn chọn size (Tùy chọn)</label>
                
                {(sizeGuideFile || (info.size_guide_image_url && info.size_guide_image_url.startsWith('http'))) ? (
                  <div className="relative group w-32 h-40 rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 transition-colors">
                    <img 
                      src={sizeGuideFile ? URL.createObjectURL(sizeGuideFile) : info.size_guide_image_url} 
                      alt="Size Guide" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => { setSizeGuideFile(null); setInfoField('size_guide_image_url', ''); }} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" title="Xóa ảnh">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="file"
                      ref={sizeGuideInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSizeGuideFile(e.target.files[0]);
                          setInfoField('size_guide_image_url', ''); // Xóa text cũ tránh lỗi required/type
                        }
                        e.target.value = ''; // Reset
                      }}
                    />
                    <button type="button" onClick={() => sizeGuideInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary font-bold text-sm w-full sm:w-auto">
                      <Upload className="w-5 h-5" /> Tải ảnh từ máy
                    </button>
                    
                    <span className="text-muted-foreground text-xs font-bold uppercase text-center sm:text-left hidden sm:inline-block">HOẶC</span>
                    
                    <button type="button" onClick={() => {
                        const url = window.prompt("Nhập URL ảnh bảng size:");
                        if (url && url.trim().startsWith('http')) {
                          setSizeGuideFile(null);
                          setInfoField('size_guide_image_url', url.trim());
                        } else if (url) {
                          toast.error("URL không hợp lệ (phải bắt đầu bằng http hoặc https)");
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-xl hover:bg-muted transition-all font-bold text-sm w-full sm:w-auto">
                      <LinkIcon className="w-4 h-4" /> Dán Link URL
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">Bạn có thể tải ảnh từ máy tính hoặc dán link. Bỏ trống sẽ dùng ảnh mặc định ngoài cửa hàng.</p>
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
              <div className="flex gap-2">
                <button type="button" onClick={handleUrlUpload}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20">
                  <LinkIcon className="w-3.5 h-3.5" /> Dán Link
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold text-background bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Tải lên
                </button>
              </div>
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

            {/* Quick-create thuộc tính */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setQuickCreateType('color')}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                <Plus className="w-3 h-3" /> Thêm màu
              </button>
              <button type="button" onClick={() => setQuickCreateType('size')}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                <Plus className="w-3 h-3" /> Thêm size
              </button>
              <button type="button" onClick={() => setQuickCreateType('material')}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/50 border border-border px-2.5 py-1 rounded-lg hover:bg-muted hover:text-foreground transition-colors">
                <Plus className="w-3 h-3" /> Thêm chất liệu
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    {['Màu sắc', 'Kích cỡ', 'Mô tả Size', 'Chất liệu', 'Mã SKU', 'Giá (VNĐ) *', 'Tồn kho', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 font-bold text-muted-foreground whitespace-nowrap">{h}</th>
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
                        <input type="text" placeholder="VD: 50-60kg, 1m60" value={v.size_description || ''}
                          onChange={e => setVariantField(idx, 'size_description', e.target.value)}
                          className="w-full min-w-[120px] py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary text-xs" />
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
                          className="w-full min-w-[100px] py-1.5 px-2 rounded border border-border bg-background outline-none focus:border-primary font-mono text-xs uppercase" />
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

      {/* Modal Quick Create */}
      <AnimatePresence>
        {quickCreateType && (
          <QuickCreateModal 
            type={quickCreateType} 
            onClose={() => setQuickCreateType(null)} 
            onSuccess={handleQuickCreateSuccess} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductForm;
