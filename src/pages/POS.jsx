import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import ProductImage from '../components/shared/ProductImage';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, X, ChevronRight, PackageOpen, Banknote } from 'lucide-react';
import posApi from '../api/posApi';
import productApi from '../api/productApi';
import orderApi from '../api/orderApi';
import statsApi from '../api/statsApi';
import customerApi from '../api/customerApi';
import { toast } from 'sonner';
import { useOrderQuote } from '../lib/useOrderQuote';
import configApi from '../api/configApi';

  const VariantSelector = ({ selectedProduct, setSelectedProduct, cart, setCart }) => {
    const [variants, setVariants] = useState([]);
    const [loadingVariants, setLoadingVariants] = useState(true);

    useEffect(() => {
      // Gọi API lấy chi tiết sản phẩm để lấy mảng variants
      const getVariants = async () => {
        try {
          const res = await productApi.getByIdAdmin(selectedProduct.product_id); // tái sử dụng productApi
          if (res && res.success) {
            const vData = (res.data.variants || []).filter(variant => variant.is_active);
            const iData = res.data.images || [];
            
            // Ghép ảnh vào biến thể tương ứng
            vData.forEach(v => {
               const variantImage = iData.find(img => img.variant_id === v.variant_id);
               // Nếu biến thể không có ảnh riêng, dùng ảnh chính của sản phẩm
               v.image_url = variantImage ? variantImage.image_url : (selectedProduct.primary_image);
            });
            setVariants(vData);
          }
        } catch {}
        setLoadingVariants(false);
      };
      getVariants();
    }, [selectedProduct.product_id, selectedProduct.primary_image]);

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
      <ModalLayer onClose={() => setSelectedProduct(null)} label="Chọn biến thể"><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                     <div className="flex items-center gap-4">
                       <ProductImage src={v.image_url} alt={v.sku} className="w-12 h-12 rounded-lg object-cover border border-border/50" />
                       <div>
                         <div className="font-bold text-sm">{v.sku}</div>
                         <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                           {v.color_name && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: v.hex_code}}></div>{v.color_name}</span>}
                           {v.size_value && <span>Size: {v.size_value}</span>}
                         </div>
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
      </div></ModalLayer>
    );
  };


const POS = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState([]);
  
  // Variant Selection Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [bankSettings, setBankSettings] = useState({});
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [transferReference, setTransferReference] = useState('');
  useEffect(() => { configApi.getSettings().then(result => setBankSettings(result.data)).catch(() => {}); }, []);
  
  const [dailyStats, setDailyStats] = useState({ totalOrders: 0, totalCash: 0, totalTransfer: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const res = await statsApi.getStaffDailyStats();
      if (res && res.success) setDailyStats(res.data);
    } catch  {}
  }, []);

  const fetchAllCustomers = useCallback(async () => {
    try {
      const res = await customerApi.getAllCustomers();
      if (res && res.success) setCustomers(res.data);
    } catch  {}
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await posApi.getProducts();
      if (res && res.success) {
        setProducts(res.data.filter(p => p.is_active));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchAllCustomers();
  }, [fetchProducts, fetchStats, fetchAllCustomers]);

  // 1. Thêm vào giỏ
  const handleProductClick = (product) => {
    // Nếu sản phẩm không có variants hoặc chỉ có 1 variant mặc định (không size màu)
    if (!product.total_variants || product.total_variants <= 1) {
       // Thêm nhanh
    }
    setSelectedProduct(product); // Mở popup chọn variant
  };

  // Popup Component cho Variant Selection
  // Cart Functions
  const updateQuantity = (variant_id, delta) => {
    if (appliedPromo) { setAppliedPromo(null); setPromoCode(''); }
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
    if (appliedPromo) { setAppliedPromo(null); setPromoCode(''); }
    setCart(cart.filter(item => item.variant_id !== variant_id));
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const discount = appliedPromo ? appliedPromo.discount_amount : 0;
  const { quote, loading: quoteLoading, error: quoteError } = useOrderQuote({ items: cart.map(item => ({ variant_id: item.variant_id, quantity: item.quantity })), customerId: customer?.customer_id, channel: 'pos', promotionId: appliedPromo?.promotion_id });
  const total = quote?.total_amount ?? subtotal - discount;

  // Promo Handler
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    try {
      const res = await posApi.applyPromotion(promoCode, subtotal);
      if (res && res.success) {
        setAppliedPromo(res.data);
      } else {
        alert(res?.message || 'Mã giảm giá không hợp lệ');
        setAppliedPromo(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi áp dụng mã');
      setAppliedPromo(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) return alert('Giỏ hàng đang trống!');
    setShowCheckoutModal(true);
    setTransferConfirmed(false);
    setTransferReference(`POS${Date.now().toString(36).toUpperCase()}`);
  };

  const handleQuickAddCustomer = async () => {
    const trimmedName = newCustomerName.trim();
    const cleanPhone = newCustomerPhone.replace(/[\s.]/g, '');
    if (!trimmedName || trimmedName.length < 2) return toast.error('Vui lòng nhập tên khách hàng (tối thiểu 2 ký tự)');
    if (!/^(0|\+84)\d{9,10}$/.test(cleanPhone)) return toast.error('Số điện thoại không hợp lệ (cần 10 số, VD: 0912345678)');
    
    setIsProcessing(true);
    try {
      const res = await customerApi.createCustomer({ full_name: trimmedName, phone: cleanPhone });
      if (res && res.success) {
        toast.success('Thêm khách hàng thành công');
        const newCustomerObj = {
          customer_id: res.data.customer_id,
          full_name: trimmedName,
          phone: cleanPhone,
          loyalty_points: 0,
          tier_name: 'Member'
        };
        setCustomers([newCustomerObj, ...customers]);
        setCustomer(newCustomerObj);
        setIsAddingCustomer(false);
        setShowCustomerSearch(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      } else {
        toast.error(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi hệ thống');
    }
    setIsProcessing(false);
  };

  const processCheckout = async () => {
    if (isProcessing || quoteLoading) return;
    if (quoteError) return toast.error(quoteError);
    if (paymentMethod === 'bank_transfer' && !transferConfirmed) return toast.error('Vui lòng xác nhận đã nhận được tiền');
    if (paymentMethod === 'cash' && cashReceived) {
        if (Number(cashReceived) < total) {
            return toast.error('Số tiền khách đưa không đủ');
        }
    }
    setIsProcessing(true);
    try {
      const orderData = {
        customer_id: customer ? customer.customer_id : null,
        items: cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity, unit_price: i.price, line_discount: 0 })),
        subtotal_amount: subtotal,
        discount_amount: discount,
        total_amount: total,
        promotion_id: appliedPromo ? appliedPromo.promotion_id : null,
        payment_method: paymentMethod === 'bank_transfer' && bankSettings.bank_bin && bankSettings.bank_account_number ? 'qr_pos' : paymentMethod,
        bank_transfer_confirmed: transferConfirmed,
        note: paymentMethod === 'bank_transfer' ? `Mã chuyển khoản: ${transferReference}` : undefined,
        cash_received: paymentMethod === 'cash' ? cashReceived : undefined
      };

      const res = await posApi.checkout(orderData);
      if (res && res.success) {
        if (paymentMethod === 'cash' && res.data && res.data.change !== undefined) {
            window.alert(`Thanh toán thành công!\n\nTiền thừa trả khách: ${new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(res.data.change)}`);
        } else {
            toast.success('Thanh toán thành công!');
        }
        setCart([]); // Xóa giỏ hàng
        setCustomer(null);
        setAppliedPromo(null);
        setPromoCode('');
        setCashReceived('');
        setShowCheckoutModal(false);
        fetchProducts(); // Cập nhật lại tồn kho hiển thị
        fetchStats();
        fetchAllCustomers(); // Cập nhật lại điểm tích luỹ
      } else {
        toast.error(res?.message || 'Có lỗi khi thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi hệ thống');
    }
    setIsProcessing(false);
  };

  const handleScanOrder = async () => {
    const code = window.prompt("Nhập mã đơn hàng (VD: ORD-...):");
    if (!code) return;
    try {
      const res = await orderApi.trackOrder(code.trim());
      if (res && res.success) {
        const order = res.data;
        if (['pending', 'confirmed', 'processing', 'shipping'].includes(order.order_status)) {
            if (window.confirm(`Đơn hàng ${order.order_code} của ${order.customer_name || 'Khách vãng lai'}\nTổng tiền: ${Number(order.total_amount).toLocaleString('vi-VN')}đ\n\nBạn muốn thanh toán và hoàn thành đơn này ngay tại quầy?`)) {
                const updateRes = await orderApi.completePickup(order.order_id);
                if (updateRes.success) {
                    toast.success('Đã hoàn thành đơn hàng!');
                } else {
                    toast.error(updateRes.message || 'Lỗi cập nhật');
                }
            }
        } else {
            alert(`Đơn hàng đang ở trạng thái: ${order.order_status}`);
        }
      } else {
        toast.error('Không tìm thấy đơn hàng');
      }
    } catch  {
      toast.error('Không tìm thấy đơn hàng hoặc lỗi hệ thống');
    }
  };

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const customerPage = useListPagination(customers.filter(c => (c.phone && c.phone.includes(customerSearchTerm)) || (c.full_name && c.full_name.toLowerCase().includes(customerSearchTerm.toLowerCase()))), customerSearchTerm);

  const filteredProducts = products.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const PAGE_SIZE_POS = 15;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE_POS));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE_POS, page * PAGE_SIZE_POS);

  return (
    <div className="flex flex-col xl:flex-row min-h-[calc(100dvh-110px)] bg-muted/20 rounded-xl overflow-hidden">
      {/* CỘT TRÁI: SẢN PHẨM */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-border/50">
        <div className="p-5 bg-gradient-to-r from-background to-muted/20 border-b border-border flex flex-col xl:flex-row gap-5 items-center justify-between shadow-sm z-10">
          <div className="flex gap-4 items-center w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
              <div className="flex items-center gap-4 bg-primary/10 text-primary px-5 py-3.5 rounded-2xl border border-primary/20 shrink-0">
                <div className="p-2.5 bg-primary/20 rounded-xl"><PackageOpen className="w-5 h-5"/></div>
                <div>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-0.5">Đơn hôm nay</div>
                    <div className="text-xl font-black">{dailyStats.totalOrders} đơn</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-emerald-500/10 text-emerald-600 px-5 py-3.5 rounded-2xl border border-emerald-500/20 shrink-0">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl"><Banknote className="w-5 h-5"/></div>
                <div>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-0.5">Tiền mặt</div>
                    <div className="text-xl font-black">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(dailyStats.totalCash)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-blue-500/10 text-blue-600 px-5 py-3.5 rounded-2xl border border-blue-500/20 shrink-0">
                <div className="p-2.5 bg-blue-500/20 rounded-xl"><CreditCard className="w-5 h-5"/></div>
                <div>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-0.5">Chuyển khoản</div>
                    <div className="text-xl font-black">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(dailyStats.totalTransfer)}</div>
                </div>
              </div>
          </div>
          <div className="flex gap-4 items-center w-full xl:w-auto xl:flex-1 xl:max-w-md ml-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" placeholder="Tìm sản phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-background border-2 border-border/60 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base shadow-sm font-medium"
                />
              </div>
              <button 
                onClick={handleScanOrder}
                className="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 whitespace-nowrap"
              >
                Quét mã đơn
              </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {isLoading && <p role="status" className="p-4 text-muted-foreground">Đang tải sản phẩm...</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1 content-start">
            {paginatedProducts.map(p => (
              <motion.div 
                whileHover={{ y: -5 }}
                key={p.product_id} onClick={() => handleProductClick(p)}
                className={`glass-panel rounded-xl overflow-hidden cursor-pointer transition-all ${p.total_inventory > 0 ? 'hover:shadow-lg hover:border-primary/50' : 'opacity-60 grayscale'}`}
              >
                <div className="aspect-square bg-muted relative">
                  <ProductImage src={p.primary_image} alt={p.product_name} className="w-full h-full object-cover" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-border/50">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted font-semibold transition-colors"
              >
                Trước
              </button>
              <span className="text-sm font-semibold">Trang {page} / {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted font-semibold transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG */}
      <div className="w-full xl:w-[380px] xl:shrink-0 flex flex-col bg-background shadow-xl z-10">
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
          {/* Thông tin Khách hàng */}
          <button onClick={() => setShowCustomerSearch(true)} className="w-full flex items-center justify-between p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors text-sm">
            {customer ? (
                <span className="flex items-center gap-2 font-bold text-primary">
                    <User className="w-4 h-4"/> {customer.full_name} ({customer.phone})
                    {customer.loyalty_points > 0 && <span className="ml-1 text-xs bg-amber-500/10 text-amber-600 px-1.5 rounded">{customer.loyalty_points} điểm</span>}
                </span>
            ) : (
                <span className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4"/> Chọn khách hàng / Khách vãng lai</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex gap-2 pt-2">
            <input 
              type="text" 
              placeholder="Mã giảm giá..." 
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              disabled={!!appliedPromo}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:border-primary disabled:opacity-50"
            />
            {appliedPromo ? (
              <button onClick={() => { setAppliedPromo(null); setPromoCode(''); }} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleApplyPromo} 
                disabled={isApplyingPromo || !promoCode.trim()} 
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Áp dụng
              </button>
            )}
          </div>

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
            onClick={handleCheckout} disabled={cart.length === 0 || isProcessing || quoteLoading || Boolean(quoteError)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 mt-4 transition-all active:scale-[0.98]"
          >
            {isProcessing ? 'Đang xử lý...' : <><CreditCard className="w-5 h-5"/> THANH TOÁN (F9)</>}
          </button>
        </div>
      </div>

      {/* Modals */}
      {selectedProduct && <VariantSelector selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} cart={cart} setCart={setCart} />}

      {/* Chọn khách hàng Modal */}
      {showCustomerSearch && (
        <ModalLayer onClose={() => setShowCustomerSearch(false)} label="Chọn khách hàng"><div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="font-bold text-lg">Tìm khách hàng</h3>
                    <button onClick={() => setShowCustomerSearch(false)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                {isAddingCustomer ? (
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-bold mb-1 block">Tên khách hàng</label>
                            <input 
                                type="text" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none" placeholder="Nhập tên..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold mb-1 block">Số điện thoại</label>
                            <input 
                                type="text" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none" placeholder="Nhập số điện thoại..."
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsAddingCustomer(false)} className="flex-1 py-2 border rounded-lg hover:bg-muted font-bold transition-colors">Hủy</button>
                            <button onClick={handleQuickAddCustomer} disabled={isProcessing} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-colors">
                                {isProcessing ? 'Đang thêm...' : 'Thêm & Chọn'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" placeholder="Tìm theo SĐT hoặc tên..." 
                                    value={customerSearchTerm} onChange={e => setCustomerSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg outline-none focus:border-primary"
                                />
                            </div>
                            <button onClick={() => setIsAddingCustomer(true)} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity">
                                <Plus className="w-4 h-4"/> Mới
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2">
                    <div 
                        onClick={() => { setCustomer(null); setShowCustomerSearch(false); }}
                        className="p-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-3 border-b border-border/50"
                    >
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center"><User className="w-5 h-5"/></div>
                        <div className="font-bold">Khách vãng lai</div>
                    </div>
                    {customerPage.items.map(c => (
                        <div 
                            key={c.customer_id}
                            onClick={() => { setCustomer(c); setShowCustomerSearch(false); }}
                            className="p-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-3 border-b border-border/50"
                        >
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                                {c.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold">{c.full_name}</div>
                                <div className="text-sm text-muted-foreground">{c.phone} | Hạng: {c.tier_name || 'Member'} | {c.loyalty_points || 0} điểm</div>
                            </div>
                        </div>
                    ))}
                    <Pagination {...customerPage.paginationProps} />
                </div>
                </>
                )}
            </motion.div>
        </div></ModalLayer>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <ModalLayer onClose={() => setShowCheckoutModal(false)} label="Thanh toán tại quầy"><div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl">
                <div className="p-4 border-b border-border flex justify-between items-center bg-primary text-primary-foreground">
                    <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5"/> Thanh toán</h3>
                    <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-primary-foreground/20 rounded-full text-white"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Tổng tiền cần thanh toán</div>
                        <div className="text-3xl font-black text-primary">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(total)}</div>
                    </div>

                    <div className="space-y-3">
                        <div className="font-bold">Phương thức thanh toán</div>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={`p-3 border rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}
                            >
                                Tiền mặt
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('bank_transfer')}
                                className={`p-3 border rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}
                            >
                                Chuyển khoản
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'bank_transfer' && <div className="space-y-3 text-sm">
                      {bankSettings.bank_bin && bankSettings.bank_account_number ? <><img alt="Mã VietQR thanh toán tại quầy" className="mx-auto w-56 max-w-full rounded-lg" src={`https://img.vietqr.io/image/${encodeURIComponent(bankSettings.bank_bin)}-${encodeURIComponent(bankSettings.bank_account_number)}-compact2.png?amount=${Math.round(total)}&addInfo=${encodeURIComponent(transferReference)}&accountName=${encodeURIComponent(bankSettings.bank_account_name || '')}`} /><p className="text-center">{bankSettings.bank_account_name} • {bankSettings.bank_account_number}<br />Nội dung: <strong>{transferReference}</strong></p></> : <p className="text-muted-foreground">Chưa có tài khoản nhận VietQR. Quản trị viên có thể bổ sung trong Cài đặt hệ thống → Thanh toán.</p>}
                      <label className="flex items-start gap-3 p-3 rounded-lg border border-border"><input type="checkbox" className="mt-1" checked={transferConfirmed} onChange={event => setTransferConfirmed(event.target.checked)} /><span>Tôi đã kiểm tra tiền vào tài khoản và xác nhận đã nhận đủ {Number(total).toLocaleString('vi-VN')}đ.</span></label>
                    </div>}
                    {paymentMethod === 'cash' && (
                        <div className="space-y-2">
                            <label className="font-bold text-sm">Tiền khách đưa</label>
                            <input 
                                type="number" 
                                value={cashReceived} 
                                onChange={e => setCashReceived(e.target.value)}
                                className="w-full p-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary text-lg font-bold"
                                placeholder="Nhập số tiền..."
                            />
                            <div className="flex flex-wrap gap-2 pt-1">
                                <button type="button" onClick={() => setCashReceived(String(Math.round(total)))} className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors">Đúng số tiền</button>
                                {[100000, 200000, 500000].filter(amt => amt >= total).map(amt => (
                                    <button key={amt} type="button" onClick={() => setCashReceived(String(amt))} className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors">
                                        {amt.toLocaleString('vi-VN')}đ
                                    </button>
                                ))}
                            </div>
                            {cashReceived && Number(cashReceived) >= total && (
                                <div className="flex justify-between text-sm pt-1">
                                    <span className="text-muted-foreground">Tiền thừa trả khách:</span>
                                    <span className="font-bold text-green-500">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(Number(cashReceived) - total)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={processCheckout} 
                        disabled={isProcessing || quoteLoading || Boolean(quoteError) || (paymentMethod === 'bank_transfer' && !transferConfirmed) || (paymentMethod === 'cash' && (!cashReceived || Number(cashReceived) < total))}
                        className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {isProcessing ? 'Đang xử lý...' : 'HOÀN TẤT THANH TOÁN'}
                    </button>
                </div>
            </motion.div>
        </div></ModalLayer>
      )}
    </div>
  );
};

export default POS;
