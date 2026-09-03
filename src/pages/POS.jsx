import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, X, ChevronRight, PackageOpen } from 'lucide-react';
import posApi from '../api/posApi';
import productApi from '../api/productApi';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  // Variant Selection Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await posApi.getProducts();
      if (res && res.success) {
        setProducts(res.data.filter(p => p.is_active)); // Chỉ bán hàng đang active
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  // 1. Thêm vào giỏ
  const handleProductClick = (product) => {
    // Nếu sản phẩm không có variants hoặc chỉ có 1 variant mặc định (không size màu)
    if (!product.total_variants || product.total_variants <= 1) {
       // Thêm nhanh
       // (Giả sử tạm lấy variant_id đầu tiên nếu API getProducts trả về mảng variants, 
       //  hiện API getAll của products chưa trả về chi tiết mảng variants. 
       //  Vì vậy, ta cần gọi getById hoặc sửa API getAll để lấy biến thể mặc định.
       //  Tạm thời hiển thị popup chọn variant luôn cho chuẩn.)
    }
    setSelectedProduct(product); // Mở popup chọn variant
  };

  // Popup Component cho Variant Selection
  const VariantSelector = () => {
    const [variants, setVariants] = useState([]);
    const [loadingVariants, setLoadingVariants] = useState(true);

    useEffect(() => {
      // Gọi API lấy chi tiết sản phẩm để lấy mảng variants
      const getVariants = async () => {
        try {
          const res = await productApi.getById(selectedProduct.product_id); // tái sử dụng productApi
          if (res && res.success) {
            setVariants(res.data.variants || []);
          }
        } catch(e) {}
        setLoadingVariants(false);
      };
      getVariants();
    }, []);

    const addToCart = (variant) => {
      if (variant.inventory_quantity <= 0) {
        alert('Biến thể này đã hết hàng!');
        return;
      }
      
      const existingItem = cart.find(item => item.variant_id === variant.variant_id);
      if (existingItem) {
        if (existingItem.quantity >= variant.inventory_quantity) {
           alert('Không đủ tồn kho!');
           return;
        }
        setCart(cart.map(item => 
          item.variant_id === variant.variant_id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        ));
      } else {
        setCart([...cart, {
          variant_id: variant.variant_id,
          product_name: selectedProduct.product_name,
          sku: variant.sku,
          price: variant.price,
          quantity: 1,
          size: variant.size_value,
          color: variant.color_name,
          max_quantity: variant.inventory_quantity
        }]);
      }
      setSelectedProduct(null); // Đóng popup
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
            <h3 className="font-bold text-lg">{selectedProduct.product_name}</h3>
            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5"/></button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {loadingVariants ? (
               <div className="text-center p-8 text-muted-foreground">Đang tải biến thể...</div>
            ) : variants.length === 0 ? (
               <div className="text-center p-8 text-muted-foreground">Không có biến thể nào đang mở bán.</div>
            ) : (
               <div className="space-y-3">
                 {variants.map(v => (
                   <div key={v.variant_id} onClick={() => addToCart(v)} 
                        className={`flex justify-between items-center p-4 border rounded-xl cursor-pointer transition-colors ${v.inventory_quantity > 0 ? 'hover:border-primary hover:bg-primary/5 border-border' : 'opacity-50 cursor-not-allowed border-border/50 bg-muted/50'}`}>
                     <div>
                       <div className="font-bold text-sm">{v.sku}</div>
                       <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                         {v.color_name && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: v.hex_code}}></div>{v.color_name}</span>}
                         {v.size_value && <span>Size: {v.size_value}</span>}
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(v.price)}</div>
                       <div className="text-xs text-muted-foreground">Tồn kho: {v.inventory_quantity}</div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // Cart Functions
  const updateQuantity = (variant_id, delta) => {
    setCart(cart.map(item => {
      if (item.variant_id === variant_id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.max_quantity) return { ...item, quantity: newQ };
        if (newQ > item.max_quantity) alert(`Chỉ còn ${item.max_quantity} sản phẩm trong kho`);
      }
      return item;
    }));
  };

  const removeItem = (variant_id) => {
    setCart(cart.filter(item => item.variant_id !== variant_id));
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const discount = 0; // Tương lai tích hợp voucher
  const total = subtotal - discount;

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Giỏ hàng đang trống!');
    
    setIsProcessing(true);
    try {
      const orderData = {
        customer_id: null, // Bán vãng lai
        items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity, unit_price: i.price, line_discount: 0 })),
        subtotal_amount: subtotal,
        discount_amount: discount,
        total_amount: total
      };

      const res = await posApi.checkout(orderData);
      if (res && res.success) {
        alert('Thanh toán thành công!');
        setCart([]); // Xóa giỏ hàng
        fetchProducts(); // Cập nhật lại tồn kho hiển thị
      } else {
        alert(res?.message || 'Có lỗi khi thanh toán');
      }
    } catch (err) {
      alert(err.message || 'Lỗi hệ thống');
    }
    setIsProcessing(false);
  };

  const filteredProducts = products.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-muted/20 -m-8">
      {/* CỘT TRÁI: SẢN PHẨM */}
      <div className="flex-1 flex flex-col border-r border-border/50">
        <div className="p-4 bg-background border-b border-border/50 flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" placeholder="Tìm sản phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={p.product_id} onClick={() => handleProductClick(p)}
                className={`glass-panel rounded-xl overflow-hidden cursor-pointer transition-all ${p.total_inventory > 0 ? 'hover:shadow-lg hover:border-primary/50' : 'opacity-60 grayscale'}`}
              >
                <div className="aspect-square bg-muted relative">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><PackageOpen size={32}/></div>
                  )}
                  {p.total_inventory <= 0 && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center font-bold text-red-500 backdrop-blur-sm">Hết hàng</div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">{p.product_name}</h4>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(p.base_price)}</span>
                    <span className="text-xs text-muted-foreground">Kho: {p.total_inventory}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG */}
      <div className="w-[400px] flex flex-col bg-background shadow-xl z-10">
        <div className="p-4 border-b border-border/50 bg-primary/5 flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h2 className="font-black text-lg">Giỏ hàng POS</h2>
          <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">{cart.length} món</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p>Chưa có sản phẩm nào</p>
              </div>
            ) : (
              cart.map((item) => (
                <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} key={item.variant_id} className="flex gap-3 p-3 border border-border/50 rounded-xl bg-muted/10">
                  <div className="flex-1">
                    <div className="font-bold text-sm line-clamp-1">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                      <span>{item.sku}</span>
                      {item.color && <span>• {item.color}</span>}
                      {item.size && <span>• Size {item.size}</span>}
                    </div>
                    <div className="font-bold text-primary text-sm mt-2">
                      {new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(item.price)}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                    <button onClick={() => removeItem(item.variant_id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4"/></button>
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.variant_id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded"><Minus className="w-3 h-3"/></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variant_id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded"><Plus className="w-3 h-3"/></button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/10 space-y-3">
          {/* Thông tin Khách hàng Tạm thời ẩn, mặc định là Khách lẻ */}
          <button className="w-full flex items-center justify-between p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors text-sm">
            <span className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4"/> Khách hàng vãng lai</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-bold">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className="font-bold text-green-500">-{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(discount)}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-border">
              <span className="font-bold">Tổng thanh toán</span>
              <span className="text-2xl font-black text-primary">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(total)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout} disabled={cart.length === 0 || isProcessing}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 mt-4 transition-all active:scale-[0.98]"
          >
            {isProcessing ? 'Đang xử lý...' : <><CreditCard className="w-5 h-5"/> THANH TOÁN (F9)</>}
          </button>
        </div>
      </div>

      {selectedProduct && <VariantSelector />}
    </div>
  );
};

export default POS;
