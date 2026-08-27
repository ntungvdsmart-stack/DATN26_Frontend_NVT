import React, { useState } from 'react';
import { dummyProducts } from '../utils/dummyData';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, UserPlus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const categories = ['Tất cả', 'Áo thun', 'Áo khoác', 'Quần', 'Váy', 'Giày', 'Túi xách', 'Phụ kiện'];

const POS = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tất cả');
  const [paid, setPaid] = useState(false);
  const [discount, setDiscount] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const filtered = dummyProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'Tất cả' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setPaid(false); setDiscount(''); setDiscountApplied(false); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discountAmt;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const statusColors = {
    'Đủ hàng': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
    'Còn ít': 'text-amber-600 bg-amber-50 dark:bg-amber-950',
  };

  return (
    <div className="flex h-[calc(100vh-70px)] gap-0 -m-8">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Search & Filter */}
        <div className="p-4 border-b border-border bg-background space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Tìm sản phẩm hoặc quét mã vạch..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all",
                  selectedCat === cat
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(product => {
              const inCart = cart.find(i => i.id === product.id);
              const stockLabel = product.stock > 50 ? 'Đủ hàng' : 'Còn ít';
              return (
                <motion.button
                  key={product.id}
                  layout
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(product)}
                  className={cn(
                    "relative text-left rounded-xl overflow-hidden border transition-all",
                    inCart ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-foreground/40"
                  )}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  {inCart && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow">
                      {inCart.qty}
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold line-clamp-1 mb-1">{product.name}</p>
                    <p className="text-xs font-bold text-primary">{product.price.toLocaleString('vi-VN')}đ</p>
                    <p className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-1", statusColors[stockLabel])}>
                      {stockLabel} ({product.stock})
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
              Không tìm thấy sản phẩm
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart / Bill */}
      <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <h2 className="font-bold text-sm">Hóa đơn</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1.5 transition-colors">
              <UserPlus size={14} /> Khách
            </button>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-destructive hover:text-destructive/80 border border-destructive/30 rounded-lg px-2 py-1.5 transition-colors flex items-center gap-1">
                <X size={14} /> Xóa
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                <ShoppingCart size={36} strokeWidth={1} className="mb-3 opacity-30" />
                <p className="text-sm">Chưa có sản phẩm</p>
                <p className="text-xs mt-1">Bấm vào sản phẩm để thêm</p>
              </div>
            ) : cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-3 p-3 hover:bg-muted/30 transition-colors group"
              >
                <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-primary font-bold mt-0.5">{item.price.toLocaleString('vi-VN')}đ</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-xs font-bold ml-auto">{(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all self-start mt-1">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-3 bg-background">
            {/* Discount Code */}
            <div className="flex gap-2">
              <input
                value={discount}
                onChange={e => setDiscount(e.target.value.toUpperCase())}
                type="text"
                placeholder="Mã khuyến mãi"
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={() => { if (discount === 'SALE10') setDiscountApplied(true); }}
                className={cn("px-3 py-2 text-xs font-bold rounded-lg transition-colors", discountApplied ? "bg-emerald-600 text-white" : "bg-muted border border-border hover:border-foreground/40")}
              >
                {discountApplied ? <Check size={14} /> : 'Áp dụng'}
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-emerald-600 text-xs">
                  <span>Giảm giá (10%)</span>
                  <span>-{discountAmt.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>Tổng cộng</span>
                <span>{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button className="py-3 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
                Tiền mặt
              </button>
              <button className="py-3 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors">
                Chuyển khoản
              </button>
            </div>
            <button
              onClick={() => { setPaid(true); setTimeout(() => { clearCart(); }, 2000); }}
              className="w-full bg-foreground text-background py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 active:scale-[0.99] transition-all"
            >
              <CreditCard size={18} />
              {paid ? '✓ Thanh toán thành công!' : 'Thanh toán ngay'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
