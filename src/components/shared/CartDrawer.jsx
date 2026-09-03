import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

const CartDrawer = () => {
  const navigate = useNavigate();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-background border-l border-border shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold tracking-tight">Giỏ Hàng Của Bạn</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p>Giỏ hàng trống.</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-6 uppercase text-sm font-semibold tracking-wider hover:text-foreground transition-colors border-b border-foreground pb-1"
                  >
                    Tiếp tục mua sắm
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id} 
                    className="flex gap-4 group"
                  >
                    <div className="w-24 h-32 bg-muted overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? ` | Màu: ${item.color}` : ''}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-border">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-muted transition-colors"><Minus size={14} /></button>
                          <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-muted transition-colors"><Plus size={14} /></button>
                        </div>
                        <p className="font-semibold">{item.price.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                <div className="flex justify-between mb-6 text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">Phí vận chuyển và thuế sẽ được tính khi thanh toán.</p>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/store/checkout');
                  }}
                  className="w-full bg-foreground text-background py-4 flex items-center justify-center gap-2 font-semibold uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                >
                  Thanh toán <ArrowRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
