import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Heart, Share2, ShoppingBag, Truck, RotateCcw, ShieldCheck, Loader2 } from 'lucide-react';
import productApi from '../api/productApi';
import { useCartStore } from '../store/cartStore';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lựa chọn hiện tại
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await productApi.getByIdPublic(id);
        if (res && res.success && res.data) {
          setProduct(res.data);
        } else {
          setError('Không tìm thấy sản phẩm');
        }
      } catch (err) {
        setError('Lỗi kết nối. Vui lòng thử lại sau.');
      }
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

  // Derived state: Lọc ra các màu và size có sẵn từ danh sách biến thể
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    const colors = new Map();
    product.variants.forEach(v => {
      if (v.color_id && !colors.has(v.color_id)) {
        colors.set(v.color_id, { id: v.color_id, name: v.color_name, hex: v.hex_code });
      }
    });
    return Array.from(colors.values());
  }, [product]);

  const availableSizesForColor = useMemo(() => {
    if (!product?.variants || !selectedColor) return [];
    const sizes = new Map();
    product.variants.filter(v => String(v.color_id) === String(selectedColor)).forEach(v => {
      if (v.size_id && !sizes.has(v.size_id)) {
        sizes.set(v.size_id, { id: v.size_id, name: v.size_value, stock: v.inventory_quantity });
      }
    });
    return Array.from(sizes.values()).sort((a, b) => {
      const order = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5 };
      return (order[a.name] || 99) - (order[b.name] || 99);
    });
  }, [product, selectedColor]);

  // Chọn màu đầu tiên mặc định
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(String(availableColors[0].id));
    }
  }, [availableColors, selectedColor]);

  // Lọc hình ảnh theo màu đã chọn (nếu ảnh không gắn variant thì là ảnh chung)
  const displayImages = useMemo(() => {
    if (!product?.images) return [];
    // Lấy variant_id của màu đang chọn (nếu có)
    const matchingVariants = product.variants?.filter(v => String(v.color_id) === String(selectedColor)).map(v => v.variant_id) || [];
    
    // Ảnh phù hợp: Ảnh chung (variant_id IS NULL) HOẶC ảnh thuộc màu đang chọn
    const filtered = product.images.filter(img => 
      !img.variant_id || matchingVariants.includes(img.variant_id)
    );

    // Nếu không có ảnh nào phù hợp, trả về ảnh chính
    return filtered.length > 0 ? filtered : product.images.slice(0, 1);
  }, [product, selectedColor]);

  // Reset selected size khi đổi màu
  useEffect(() => {
    setSelectedSize('');
    setQuantity(1);
    setActiveImageIndex(0);
  }, [selectedColor]);

  // Xác định variant đang được chọn cụ thể
  const selectedVariant = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => 
      String(v.color_id) === String(selectedColor) && String(v.size_id) === String(selectedSize)
    );
  }, [product, selectedColor, selectedSize]);

  const maxStock = selectedVariant ? selectedVariant.inventory_quantity : 0;
  const priceToDisplay = selectedVariant ? selectedVariant.price : product?.base_price;

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      alert('Vui lòng chọn màu sắc và kích cỡ');
      return;
    }
    if (!selectedVariant || maxStock <= 0) {
      alert('Sản phẩm đã hết hàng');
      return;
    }

    addItem({
      id: selectedVariant.variant_id, // Lưu ý: Giỏ hàng lưu variant_id
      product_id: product.product_id,
      name: product.product_name,
      category: product.category_name,
      price: priceToDisplay,
      image: displayImages[0]?.image_url,
      color: availableColors.find(c => String(c.id) === String(selectedColor))?.name,
      size: availableSizesForColor.find(s => String(s.id) === String(selectedSize))?.name,
      sku: selectedVariant.sku
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">{error || 'Không tìm thấy sản phẩm'}</h2>
      <button onClick={() => navigate('/store')} className="text-primary underline">Quay lại cửa hàng</button>
    </div>
  );

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 md:py-6 text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <button onClick={() => navigate('/store')} className="hover:text-foreground transition-colors">Trang chủ</button>
        <ChevronRight className="w-3 h-3" />
        <button className="hover:text-foreground transition-colors">{product.category_name || 'Sản phẩm'}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground truncate max-w-[200px] md:max-w-xs">{product.product_name}</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          
          {/* Cột trái: Hình ảnh */}
          <div className="w-full lg:w-3/5 flex flex-col-reverse md:flex-row gap-4 h-fit">
            {/* Thumbnails (Dọc trên desktop, ngang trên mobile) */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-none w-full md:w-20 lg:w-24 shrink-0">
              {displayImages.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-[3/4] w-20 md:w-full shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-foreground' : 'border-transparent hover:border-foreground/30'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Ảnh to */}
            <div className="w-full aspect-[3/4] md:aspect-[4/5] bg-muted rounded-xl overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  src={displayImages[activeImageIndex]?.image_url}
                  alt={product.product_name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Cột phải: Thông tin sản phẩm */}
          <div className="w-full lg:w-2/5 flex flex-col pt-4 lg:pt-0 sticky top-24">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none mb-2">{product.product_name}</h1>
            {product.brand_name && <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{product.brand_name}</p>}

            <div className="text-2xl font-medium mb-8">
              {Number(priceToDisplay).toLocaleString('vi-VN')}đ
            </div>

            {/* Chọn màu */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold uppercase tracking-widest">Màu sắc</span>
                <span className="text-xs text-muted-foreground">
                  {availableColors.find(c => String(c.id) === String(selectedColor))?.name || 'Chọn màu'}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {availableColors.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(String(color.id))}
                    className={`w-10 h-10 rounded-full border-2 transition-all relative overflow-hidden flex items-center justify-center p-0.5 ${
                      String(selectedColor) === String(color.id) ? 'border-foreground shadow-md' : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    <span 
                      className="w-full h-full rounded-full border border-black/10" 
                      style={{ backgroundColor: color.hex || '#ccc' }} 
                      title={color.name}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn size */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold uppercase tracking-widest">Kích cỡ</span>
                <button className="text-[10px] uppercase tracking-wider underline text-muted-foreground hover:text-foreground transition-colors">
                  Hướng dẫn chọn size
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {availableSizesForColor.map(size => {
                  const isSelected = String(selectedSize) === String(size.id);
                  const isOutOfStock = size.stock <= 0;
                  return (
                    <button
                      key={size.id}
                      onClick={() => !isOutOfStock && setSelectedSize(String(size.id))}
                      disabled={isOutOfStock}
                      className={`py-3 text-sm font-semibold transition-all border ${
                        isSelected 
                          ? 'border-foreground bg-foreground text-background shadow-md' 
                          : isOutOfStock 
                            ? 'border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                            : 'border-border hover:border-foreground'
                      }`}
                    >
                      {size.name}
                    </button>
                  );
                })}
              </div>
              {selectedSize && maxStock > 0 && maxStock <= 10 && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Chỉ còn {maxStock} sản phẩm</p>
              )}
              {selectedSize && maxStock === 0 && (
                <p className="text-xs text-red-500 mt-2 font-medium">Size này đã hết hàng</p>
              )}
            </div>

            {/* Thêm vào giỏ */}
            <div className="flex gap-4 mb-10">
              {/* Box số lượng (nếu cần thiết, hiện tại auto thêm 1) */}
              {/* <div className="border border-border flex items-center px-4 w-32 justify-between">
                <button className="p-2 hover:text-primary">-</button>
                <span className="font-medium">1</span>
                <button className="p-2 hover:text-primary">+</button>
              </div> */}
              <button 
                onClick={handleAddToCart}
                disabled={!selectedColor || !selectedSize || maxStock <= 0}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                  added 
                    ? 'bg-emerald-600 text-white' 
                    : (!selectedColor || !selectedSize || maxStock <= 0)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                }`}
              >
                {added ? '✓ Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
              </button>
              <button className="w-14 shrink-0 flex items-center justify-center border border-border hover:border-foreground transition-colors group">
                <Heart className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            </div>

            {/* Mô tả */}
            <div className="prose prose-sm dark:prose-invert border-t border-border pt-8 mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Mô tả sản phẩm</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
              </p>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 border-t border-border pt-8">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Miễn phí giao hàng</span>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Đổi trả 30 ngày</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Bảo hành 1 năm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
