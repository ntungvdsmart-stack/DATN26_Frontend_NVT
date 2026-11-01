import ProductImage from './ProductImage';
import React from 'react';
import ModalLayer from './ModalLayer';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';

const WishlistDrawer = () => {
  const navigate = useNavigate();
  const { items, isOpen, setIsOpen, removeItem } = useWishlistStore();

  const handleAddToCart = (item) => {
    // Transform item if needed before adding to cart, default to first available size/color usually,
    // but here we just add the product and let them choose in cart or redirect to product detail
    // Best UX: redirect to product detail so they can choose size/color
    setIsOpen(false);
    navigate(`/store/products/${item.product_id || item.id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalLayer drawer label="Danh sách yêu thích" onClose={() => setIsOpen(false)}>
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
            className="fixed top-0 right-0 h-[100dvh] max-w-full w-full sm:w-[450px] bg-background border-l border-border shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold tracking-tight">Mục Yêu Thích</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wishlist Items */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 flex flex-col gap-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Heart size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p>Chưa có sản phẩm yêu thích.</p>
                  <button 
                    onClick={() => { setIsOpen(false); navigate('/store/products'); }}
                    className="mt-6 uppercase text-sm font-semibold tracking-wider hover:text-foreground transition-colors border-b border-foreground pb-1"
                  >
                    Khám phá ngay
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.product_id || item.id} 
                    className="flex gap-4 group"
                  >
                    <div className="w-24 h-32 bg-muted overflow-hidden cursor-pointer" onClick={() => handleAddToCart(item)}>
                      <ProductImage 
                        src={item.primary_image || item.image} 
                        alt={item.product_name || item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 
                            className="font-medium text-sm line-clamp-2 cursor-pointer hover:underline"
                            onClick={() => handleAddToCart(item)}
                          >
                            {item.product_name || item.name}
                          </h3>
                          <button onClick={() => removeItem(item.product_id || item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                          {item.category_name || item.category || 'Thời trang'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <p className="font-semibold">{Number(item.base_price || item.price || 0).toLocaleString('vi-VN')}đ</p>
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border border-border hover:bg-foreground hover:text-background transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </ModalLayer>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
