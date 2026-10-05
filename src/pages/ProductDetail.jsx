import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Heart, Share2, ShoppingBag, Truck, RotateCcw, ShieldCheck, Loader2, Star, Send, ZoomIn, X } from 'lucide-react';
import productApi from '../api/productApi';
import reviewApi from '../api/reviewApi';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useWishlistStore } from '../store/wishlistStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lựa chọn hiện tại
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const { items: wishlistItems, toggleItem, isInWishlist } = useWishlistStore();
  const isWishlisted = product ? isInWishlist(product.product_id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    
    let variantId = null;
    if (selectedColor && selectedSize) {
       const v = product.variants?.find(v => String(v.color_id) === String(selectedColor) && String(v.size_id) === String(selectedSize));
       variantId = v?.variant_id;
    }
    if (!variantId && product.variants?.length > 0) {
       variantId = product.variants[0].variant_id;
    }

    toggleItem({
      product_id: product.product_id,
      variant_id: variantId,
      product_name: product.product_name,
      base_price: product.base_price,
      primary_image: product.primary_image || (product.images && product.images[0]?.image_url),
      category_name: product.category_name
    });
    
    if (isWishlisted) {
      toast('Đã bỏ khỏi mục yêu thích');
    } else {
      toast.success('Đã thêm vào mục yêu thích', { icon: <Heart size={16} className="fill-rose-500 text-rose-500" /> });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await productApi.getByIdPublic(id);
        if (res && res.success && res.data) {
          setProduct(res.data);
          
          // Fetch related products (same category)
          if (res.data.category_id) {
            const relatedRes = await productApi.getAllPublic();
            if (relatedRes && relatedRes.success) {
              const filtered = relatedRes.data
                .filter(p => p.category_id === res.data.category_id && p.product_id !== res.data.product_id)
                .slice(0, 4);
              setRelatedProducts(filtered);
            }
          }
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
        sizes.set(v.size_id, { id: v.size_id, name: v.size_value, desc: v.size_description, stock: v.inventory_quantity });
      }
    });
    return Array.from(sizes.values()).sort((a, b) => {
      const getOrder = (name) => {
        if (!name) return 99;
        const strName = String(name).toUpperCase();
        if (strName.startsWith('S')) return 1;
        if (strName.startsWith('M')) return 2;
        if (strName.startsWith('L')) return 3;
        if (strName.startsWith('XL')) return 4;
        if (strName.startsWith('XXL')) return 5;
        return 99;
      };
      return getOrder(a.name) - getOrder(b.name);
    });
  }, [product, selectedColor]);


  // ──────── LOGIC ẢNH THEO BIẾN THỂ MÀU ────────
  // Mỗi màu có thể có ảnh riêng (gắn variant_id), cộng thêm ảnh chung (variant_id IS NULL)
  // Ảnh chính (is_primary) luôn hiển thị đầu tiên
  const displayImages = useMemo(() => {
    if (!product?.images) return [];
    
    // Phân loại ảnh
    const primaryImage = product.images.find(img => img.is_primary);
    const otherImages = product.images.filter(img => img !== primaryImage);
    
    // Sắp xếp: Ảnh chính (ảnh chung) → Tất cả các ảnh còn lại
    const result = [];
    if (primaryImage) {
      result.push(primaryImage);
    }
    result.push(...otherImages);
    
    return result.length > 0 ? result : product.images;
  }, [product?.images]);

  // Tìm ảnh đại diện cho từng màu (dùng cho thumbnail swatch)
  const getColorThumbnail = useCallback((colorId) => {
    if (!product?.images || !product?.variants) return null;
    const variantIds = product.variants
      .filter(v => String(v.color_id) === String(colorId))
      .map(v => v.variant_id);
    // Ưu tiên ảnh gắn variant của màu đó
    const colorImg = product.images.find(img => img.variant_id && variantIds.includes(img.variant_id));
    if (colorImg) return colorImg.image_url;
    // Nếu không có, lấy ảnh chính
    const primary = product.images.find(img => img.is_primary);
    return primary?.image_url || product.images[0]?.image_url || null;
  }, [product]);

  // Reset selected size và chuyển ảnh khi đổi màu
  useEffect(() => {
    setSelectedSize('');
    setQuantity(1);
    
    if (product?.variants && displayImages.length > 0) {
      const variantIds = product.variants
        .filter(v => String(v.color_id) === String(selectedColor))
        .map(v => v.variant_id);
        
      const imgIndex = displayImages.findIndex(img => img.variant_id && variantIds.includes(img.variant_id));
      setActiveImageIndex(imgIndex !== -1 ? imgIndex : 0);
    } else {
      setActiveImageIndex(0);
    }
  }, [selectedColor, product?.variants, displayImages]);

  // Xác định variant đang được chọn cụ thể
  const selectedVariant = useMemo(() => {
    if (!product || !selectedColor || !selectedSize) return null;
    return product.variants.find(v => 
      String(v.color_id) === String(selectedColor) && String(v.size_id) === String(selectedSize)
    );
  }, [product, selectedColor, selectedSize]);

  const maxStock = selectedVariant ? selectedVariant.inventory_quantity : 0;
  const priceToDisplay = selectedVariant ? selectedVariant.price : product?.base_price;

  // Điều hướng ảnh bằng phím mũi tên
  const handleImageNav = useCallback((direction) => {
    if (displayImages.length <= 1) return;
    setActiveImageIndex(prev => {
      if (direction === 'next') return prev >= displayImages.length - 1 ? 0 : prev + 1;
      return prev <= 0 ? displayImages.length - 1 : prev - 1;
    });
  }, [displayImages.length]);

  // Zoom ảnh khi hover
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, []);

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast.error('Vui lòng chọn màu sắc và kích cỡ');
      return;
    }
    if (!selectedVariant || maxStock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    addItem({
      id: selectedVariant.variant_id,
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
    toast.success('Đã thêm vào giỏ hàng');
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
          
          {/* ═══ CỘT TRÁI: GALLERY ẢNH SẢN PHẨM ═══ */}
          <div className="w-full lg:w-3/5 flex flex-col-reverse md:flex-row gap-4 h-fit">
            {/* Thumbnails (Dọc trên desktop, ngang trên mobile) */}
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto scrollbar-none w-full md:w-20 lg:w-[88px] shrink-0 md:max-h-[600px]">
              {displayImages.map((img, idx) => (
                <button 
                  key={`${img.image_id}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "aspect-[3/4] w-16 md:w-full shrink-0 rounded-lg overflow-hidden border-2 transition-all relative group",
                    activeImageIndex === idx 
                      ? 'border-foreground shadow-md' 
                      : 'border-transparent hover:border-foreground/30'
                  )}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x500/f3f4f6/9ca3af?text=Lỗi+Ảnh'; }} />
                  {/* Badge: Ảnh chính */}
                  {img.is_primary ? (
                    <div className="absolute top-0.5 left-0.5 bg-foreground/80 text-background text-[7px] font-bold px-1 py-0.5 rounded">
                      BÌA
                    </div>
                  ) : null}
                  {/* Badge: Ảnh theo màu */}
                  {img.variant_id && !img.is_primary ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[7px] font-bold py-0.5 text-center">
                      {availableColors.find(c => {
                        const vIds = product.variants?.filter(v => String(v.color_id) === String(c.id)).map(v => v.variant_id) || [];
                        return vIds.includes(img.variant_id);
                      })?.name || '🎨'}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Ảnh to chính + Navigation */}
            <div 
              className="w-full aspect-[3/4] md:aspect-[4/5] bg-muted rounded-xl overflow-hidden relative group cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${activeImageIndex}-${selectedColor}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                  src={displayImages[activeImageIndex]?.image_url}
                  alt={product.product_name}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x1000/f3f4f6/9ca3af?text=Lỗi+Ảnh'; }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                  style={isZoomed ? { 
                    transform: 'scale(1.8)', 
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` 
                  } : {}}
                />
              </AnimatePresence>

              {/* Navigation arrows */}
              {displayImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleImageNav('prev'); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleImageNav('next'); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayImages.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        activeImageIndex === idx ? 'bg-foreground w-5' : 'bg-foreground/30 hover:bg-foreground/50'
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Zoom hint */}
              <div className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* ═══ CỘT PHẢI: THÔNG TIN SẢN PHẨM ═══ */}
          <div className="w-full lg:w-2/5 flex flex-col pt-4 lg:pt-0 sticky top-24">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none mb-2">{product.product_name}</h1>
            {product.brand_name && <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{product.brand_name}</p>}

            <div className="text-2xl font-medium mb-8">
              {Number(priceToDisplay).toLocaleString('vi-VN')}đ
            </div>

            {/* ── Chọn màu (với thumbnail ảnh biến thể) ── */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold uppercase tracking-widest">Màu sắc</span>
                <span className="text-xs text-muted-foreground">
                  {availableColors.find(c => String(c.id) === String(selectedColor))?.name || 'Chọn màu'}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {availableColors.map(color => {
                  const isSelected = String(selectedColor) === String(color.id);
                  const thumb = getColorThumbnail(color.id);
                  return (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(String(color.id))}
                      className={cn(
                        "relative rounded-xl overflow-hidden border-2 transition-all group/swatch",
                        isSelected 
                          ? 'border-foreground shadow-lg ring-2 ring-foreground/20' 
                          : 'border-border hover:border-foreground/50'
                      )}
                      title={color.name}
                    >
                      {/* Nếu có ảnh thumbnail cho màu này → hiển thị ảnh nhỏ */}
                      {thumb ? (
                        <div className="w-14 h-[72px] relative">
                          <img src={thumb} alt={color.name} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Lỗi'; }} />
                          {/* Tên màu overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-1 px-1">
                            <span className="text-[8px] font-bold text-white block text-center leading-tight truncate">
                              {color.name}
                            </span>
                          </div>
                          {/* Chấm tròn màu nhỏ */}
                          <div 
                            className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: color.hex || '#ccc' }}
                          />
                        </div>
                      ) : (
                        /* Fallback: hiển thị chấm tròn màu nếu không có ảnh */
                        <div className="w-12 h-12 flex items-center justify-center p-1">
                          <span 
                            className="w-full h-full rounded-full border border-black/10" 
                            style={{ backgroundColor: color.hex || '#ccc' }} 
                          />
                        </div>
                      )}
                      {/* Check mark khi chọn */}
                      {isSelected && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-foreground rounded-full flex items-center justify-center border-2 border-background shadow-md z-10">
                          <svg viewBox="0 0 12 12" className="w-3 h-3 text-background">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Mô tả số ảnh theo màu */}
              {selectedColor && product?.images && (() => {
                const variantIds = product.variants?.filter(v => String(v.color_id) === String(selectedColor)).map(v => v.variant_id) || [];
                const colorImgCount = product.images.filter(img => img.variant_id && variantIds.includes(img.variant_id)).length;
                if (colorImgCount > 0) {
                  return (
                    <p className="text-[11px] text-muted-foreground mt-2.5 flex items-center gap-1.5">
                      📸 {colorImgCount} ảnh riêng cho màu {availableColors.find(c => String(c.id) === String(selectedColor))?.name}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            {/* Chọn size */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold uppercase tracking-widest">Kích cỡ</span>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[10px] uppercase tracking-wider underline text-muted-foreground hover:text-foreground transition-colors"
                >
                  Hướng dẫn chọn size
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSizesForColor.map(size => {
                  const isSelected = String(selectedSize) === String(size.id);
                  const isOutOfStock = size.stock <= 0;
                  return (
                    <button
                      key={size.id}
                      onClick={() => !isOutOfStock && setSelectedSize(String(size.id))}
                      disabled={isOutOfStock}
                      title={size.desc || size.name}
                      className={`py-3 px-2 text-sm font-semibold transition-all border flex flex-col items-center gap-0.5 ${
                        isSelected 
                          ? 'border-foreground bg-foreground text-background shadow-md' 
                          : isOutOfStock 
                            ? 'border-border bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                            : 'border-border hover:border-foreground'
                      }`}
                    >
                      <span className="font-bold">{size.name}</span>
                      {size.desc && (
                        <span className={`text-[10px] leading-tight ${isSelected ? 'text-background/70' : 'text-muted-foreground'}`}>
                          {size.desc}
                        </span>
                      )}
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
              <button 
                onClick={handleToggleWishlist}
                className={cn(
                  "w-14 shrink-0 flex items-center justify-center border transition-colors group",
                  isWishlisted ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-border hover:border-foreground text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className={cn("w-5 h-5 transition-colors", isWishlisted && "fill-rose-500")} />
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

      {/* ──────────── SECTION: ĐÁNH GIÁ SẢN PHẨM ──────────── */}
      <ReviewSection productId={id} user={user} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-4 mt-20 border-t border-border pt-16 mb-20">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-8 text-center">
            Có thể bạn cũng thích
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p, idx) => (
              <motion.div 
                key={p.product_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate(`/store/products/${p.product_id}`);
                }}
              >
                <div className="aspect-[3/4] mb-4 bg-muted overflow-hidden relative">
                  <img 
                    src={p.primary_image || 'https://placehold.co/300x400/f3f4f6/9ca3af?text=No+Image'} 
                    alt={p.product_name} 
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x400/f3f4f6/9ca3af?text=Lỗi+Ảnh'; }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  {p.brand_name && (
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.brand_name}</p>
                  )}
                  <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">{p.product_name}</h3>
                  <p className="font-medium text-sm text-muted-foreground">{Number(p.base_price).toLocaleString('vi-VN')}đ</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ──────────── MODAL HƯỚNG DẪN CHỌN SIZE ──────────── */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsSizeGuideOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-background border border-border shadow-2xl rounded-2xl overflow-hidden max-w-2xl w-full flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-bold uppercase tracking-widest">Hướng dẫn chọn size</h3>
                <button 
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex justify-center">
                <img 
                  src={product?.size_guide_image_url || "https://res.cloudinary.com/fq2p2tby/image/upload/v1790993057/fashionOS/ui/size-guide-placeholder.jpg"} 
                  alt="Hướng dẫn chọn size" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/600x800/f3f4f6/9ca3af?text=Bảng+Size';
                  }}
                  className="w-full h-auto max-w-lg object-contain rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAR RATING COMPONENT
// ═══════════════════════════════════════════════════════════════
const StarRating = ({ rating, size = 16, interactive = false, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            size={size}
            className={`transition-colors ${
              (interactive ? (hover || rating) : rating) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-border'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// REVIEW SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════
const ReviewSection = ({ productId, user }) => {
  const [reviewData, setReviewData] = useState({ stats: null, reviews: [] });
  const [canReview, setCanReview] = useState(false);
  const [reviewableVariants, setReviewableVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formVariantId, setFormVariantId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchReviews();
    if (user && user.role === 'customer') {
      checkCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getProductReviews(productId);
      if (res?.success) setReviewData(res.data);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const checkCanReview = async () => {
    try {
      const res = await reviewApi.checkCanReview(productId);
      if (res?.success) {
        setCanReview(res.data.canReview);
        setReviewableVariants(res.data.reviewableVariants || []);
      }
    } catch (err) { /* ignore */ }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formRating) return setSubmitMsg({ type: 'error', text: 'Vui lòng chọn số sao' });
    if (!formVariantId) return setSubmitMsg({ type: 'error', text: 'Vui lòng chọn phiên bản đã mua' });

    setSubmitting(true);
    setSubmitMsg({ type: '', text: '' });
    try {
      const res = await reviewApi.createReview(productId, {
        variant_id: Number(formVariantId),
        rating: formRating,
        comment: formComment
      });
      if (res?.success) {
        setSubmitMsg({ type: 'success', text: 'Cảm ơn bạn đã đánh giá!' });
        setFormRating(0); setFormComment(''); setFormVariantId('');
        setShowForm(false);
        fetchReviews();
        checkCanReview();
      } else {
        setSubmitMsg({ type: 'error', text: res?.message || 'Lỗi' });
      }
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.message || 'Lỗi kết nối' });
    }
    setSubmitting(false);
  };

  const stats = reviewData.stats;
  const reviews = reviewData.reviews || [];
  const totalReviews = Number(stats?.total_reviews || 0);
  const avgRating = Number(stats?.avg_rating || 0);

  return (
    <div className="container mx-auto px-4 mt-16 md:mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8 border-b border-border pb-4">
          Đánh giá sản phẩm
          {totalReviews > 0 && <span className="text-muted-foreground font-medium text-base ml-3">({totalReviews})</span>}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats overview */}
            {totalReviews > 0 && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10 p-6 bg-card border border-border">
                <div className="text-center md:text-left">
                  <p className="text-5xl font-black">{avgRating}</p>
                  <StarRating rating={Math.round(avgRating)} size={18} />
                  <p className="text-xs text-muted-foreground mt-2">{totalReviews} đánh giá</p>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = Number(stats?.[`star_${star}`] || 0);
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-xs font-bold w-8 text-right">{star}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write review button */}
            {canReview && !showForm && (
              <button onClick={() => setShowForm(true)} className="mb-8 bg-foreground text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-foreground/90 transition-colors">
                Viết đánh giá
              </button>
            )}

            {submitMsg.text && (
              <div className={`p-3 mb-6 text-sm border flex items-center gap-2 ${submitMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                {submitMsg.text}
              </div>
            )}

            {/* Review form */}
            <AnimatePresence>
              {showForm && (
                <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} onSubmit={handleSubmitReview} className="mb-10 p-6 border border-border bg-card overflow-hidden">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Viết đánh giá của bạn</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Phiên bản đã mua *</label>
                      <select value={formVariantId} onChange={e => setFormVariantId(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-background border border-border outline-none focus:border-foreground transition-colors text-sm">
                        <option value="">Chọn phiên bản</option>
                        {reviewableVariants.map(v => (
                          <option key={v.variant_id} value={v.variant_id}>{v.color_name || ''} {v.size_value ? `- ${v.size_value}` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Đánh giá *</label>
                      <StarRating rating={formRating} size={28} interactive onChange={setFormRating} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Nhận xét (tùy chọn)</label>
                      <textarea value={formComment} onChange={e => setFormComment(e.target.value)} rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors text-sm resize-none" />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={submitting} className="bg-foreground text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Gửi đánh giá
                      </button>
                      <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-xs uppercase tracking-widest border border-border hover:bg-muted transition-colors">Hủy</button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Chưa có đánh giá nào cho sản phẩm này</p>
                <p className="text-sm mt-1">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(review => (
                  <div key={review.review_id} className="border-b border-border pb-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold uppercase">
                          {review.customer_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{review.customer_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {review.color_name && `${review.color_name}`}{review.size_value && ` · ${review.size_value}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                    {review.comment && (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
