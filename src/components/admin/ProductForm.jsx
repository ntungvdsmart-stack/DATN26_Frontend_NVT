import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Save, Trash2, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import productApi from '../../api/productApi';

const ProductForm = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data for Selects
  const [attributes, setAttributes] = useState({
    categories: [], brands: [], sizes: [], colors: [], materials: []
  });

  // Form State
  const [productData, setProductData] = useState({
    product_name: '', category_id: '', brand_id: '', base_price: 0, description: ''
  });
  
  const [images, setImages] = useState([{ url: '', is_primary: true }]);
  
  const [variants, setVariants] = useState([{
    sku: '', size_id: '', color_id: '', material_id: '', price: 0, quantity: 0
  }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await productApi.getFormAttributes();
        if (res && res.success) {
          setAttributes(res.data);
          // Set default category if available
          if (res.data.categories.length > 0) {
            setProductData(p => ({ ...p, category_id: res.data.categories[0].category_id }));
          }
        }
      } catch (err) {
        setErrorMsg('Không thể tải dữ liệu danh mục. Vui lòng thử lại sau.');
      }
      setIsFetchingData(false);
    };
    fetchData();
  }, []);

  // Handlers for Basic Info
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ 
      ...prev, 
      [name]: (name === 'base_price' || name === 'category_id' || name === 'brand_id') ? Number(value) || value : value 
    }));
    
    // Auto sync base_price to all variants if they haven't been customized
    if (name === 'base_price') {
      const newPrice = Number(value) || 0;
      setVariants(prev => prev.map(v => ({ ...v, price: newPrice })));
    }
  };

  // Handlers for Images
  const addImage = () => setImages([...images, { url: '', is_primary: images.length === 0 }]);
  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));
  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index].url = value;
    setImages(newImages);
  };
  const setPrimaryImage = (index) => {
    const newImages = images.map((img, i) => ({ ...img, is_primary: i === index }));
    setImages(newImages);
  };

  // Handlers for Variants
  const addVariant = () => {
    setVariants([...variants, {
      sku: '', size_id: '', color_id: '', material_id: '', price: productData.base_price, quantity: 0
    }]);
  };
  const removeVariant = (index) => {
    if (variants.length <= 1) return alert('Sản phẩm phải có ít nhất 1 biến thể');
    setVariants(variants.filter((_, i) => i !== index));
  };
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = (field === 'price' || field === 'quantity' || field.endsWith('_id')) 
      ? (value ? Number(value) : '') 
      : value;
    setVariants(newVariants);
  };

  const validate = () => {
    if (!productData.product_name.trim()) return 'Vui lòng nhập tên sản phẩm';
    if (!productData.category_id) return 'Vui lòng chọn danh mục';
    if (productData.base_price <= 0) return 'Giá cơ bản phải lớn hơn 0';
    
    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (v.price <= 0) return `Giá của biến thể dòng ${i + 1} không hợp lệ`;
      if (!v.size_id && !v.color_id && !v.material_id) {
         return `Biến thể dòng ${i + 1} phải chọn ít nhất 1 thuộc tính (Size/Màu/Chất liệu)`;
      }
    }
    
    // Lọc bỏ ảnh trống
    const validImages = images.filter(i => i.url.trim() !== '');
    if (validImages.length === 0) return 'Vui lòng cung cấp ít nhất 1 đường dẫn ảnh (URL)';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return setErrorMsg(error);

    setIsLoading(true);
    setErrorMsg('');

    try {
      const validImages = images.filter(i => i.url.trim() !== '');
      
      const payload = {
        product: productData,
        variants: variants,
        images: validImages
      };

      const res = await productApi.create(payload);
      if (res && res.success) {
        onSuccess(); // Trở về list
      } else {
        setErrorMsg(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ');
    }
    
    setIsLoading(false);
  };

  if (isFetchingData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Đang tải dữ liệu thuộc tính...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="bg-background rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col h-[calc(100vh-100px)]"
    >
      <div className="p-6 border-b border-border/50 bg-muted/20 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold">Thêm Sản phẩm Mới</h2>
          <p className="text-sm text-muted-foreground">Tạo sản phẩm, thêm các biến thể (size, màu) và thiết lập tồn kho ban đầu.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
          <X className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
        <form id="productForm" onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {errorMsg}
            </div>
          )}

          {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
          <section className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-2 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">1</span>
              Thông tin chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-bold text-muted-foreground">Tên sản phẩm *</label>
                <input 
                  type="text" name="product_name" required value={productData.product_name} onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 outline-none"
                  placeholder="VD: Áo thun nam Cotton Compact"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Giá bán cơ bản (VNĐ) *</label>
                <input 
                  type="number" name="base_price" required min="0" value={productData.base_price} onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Danh mục *</label>
                <select 
                  name="category_id" required value={productData.category_id} onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {attributes.categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.parent_name ? `${c.parent_name} > ${c.category_name}` : c.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground">Thương hiệu</label>
                <select 
                  name="brand_id" value={productData.brand_id} onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                >
                  <option value="">-- Không có thương hiệu --</option>
                  {attributes.brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-bold text-muted-foreground">Mô tả sản phẩm</label>
                <textarea 
                  name="description" rows="3" value={productData.description} onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-primary outline-none"
                  placeholder="Nhập mô tả chi tiết..."
                ></textarea>
              </div>
            </div>
          </section>

          {/* KHỐI 2: HÌNH ẢNH (Dùng URL Link) */}
          <section className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">2</span>
                Hình ảnh (URL Link)
              </h3>
              <button type="button" onClick={addImage} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Thêm Link Ảnh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((img, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-xl border ${img.is_primary ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                  {img.url ? (
                    <img src={img.url} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border/50 bg-muted" onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=L%E1%BB%97i+%E1%BA%A3nh'; }} />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <input 
                      type="url" value={img.url} onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="Dán link ảnh vào đây (https://...)"
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none"
                    />
                    <div className="flex justify-between items-center px-1">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-muted-foreground">
                        <input type="radio" checked={img.is_primary} onChange={() => setPrimaryImage(index)} className="accent-primary" />
                        Ảnh đại diện (Bìa)
                      </label>
                      <button type="button" onClick={() => removeImage(index)} className="text-red-500 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* KHỐI 3: BIẾN THỂ & TỒN KHO */}
          <section className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">3</span>
                Các phiên bản (SKU) & Tồn kho kho tổng
              </h3>
              <button type="button" onClick={addVariant} className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-primary/20">
                <Plus className="w-4 h-4" /> Thêm Phiên bản
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-3 font-bold">Màu sắc</th>
                    <th className="p-3 font-bold">Kích cỡ</th>
                    <th className="p-3 font-bold">Chất liệu</th>
                    <th className="p-3 font-bold">Mã SKU (Bỏ trống = Tự tạo)</th>
                    <th className="p-3 font-bold">Giá riêng (VNĐ)</th>
                    <th className="p-3 font-bold">Tồn kho ban đầu</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {variants.map((v, index) => (
                    <tr key={index} className="hover:bg-muted/10">
                      <td className="p-2">
                        <select 
                          value={v.color_id} onChange={(e) => handleVariantChange(index, 'color_id', e.target.value)}
                          className="w-full p-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                        >
                          <option value="">- Chọn Màu -</option>
                          {attributes.colors.map(c => (
                            <option key={c.color_id} value={c.color_id}>{c.color_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select 
                          value={v.size_id} onChange={(e) => handleVariantChange(index, 'size_id', e.target.value)}
                          className="w-full p-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                        >
                          <option value="">- Chọn Size -</option>
                          {attributes.sizes.map(s => (
                            <option key={s.size_id} value={s.size_id}>{s.size_value}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select 
                          value={v.material_id} onChange={(e) => handleVariantChange(index, 'material_id', e.target.value)}
                          className="w-full p-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                        >
                          <option value="">- Không có -</option>
                          {attributes.materials.map(m => (
                            <option key={m.material_id} value={m.material_id}>{m.material_name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" placeholder="Auto..." value={v.sku} onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-full p-2 rounded-lg border border-border bg-background outline-none focus:border-primary font-mono text-xs uppercase"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" min="0" required value={v.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          className="w-full p-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" min="0" required value={v.quantity} onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                          className="w-[80px] p-2 rounded-lg border border-border bg-background outline-none focus:border-primary"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => removeVariant(index)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground pt-1">* Bạn có thể tạo nhiều biến thể cho 1 sản phẩm. Kho tổng (Chi nhánh ID 1) sẽ nhận số lượng tồn kho ban đầu này.</p>
          </section>
        </form>
      </div>

      {/* FOOTER */}
      <div className="p-5 border-t border-border/50 bg-background flex justify-end gap-3 sticky bottom-0 z-10">
        <button 
          type="button" onClick={onClose}
          className="px-6 py-3 font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Hủy bỏ
        </button>
        <button 
          type="submit" form="productForm" disabled={isLoading}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Lưu Sản Phẩm
        </button>
      </div>
    </motion.div>
  );
};

export default ProductForm;
