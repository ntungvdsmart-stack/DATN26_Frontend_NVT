import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dummyProducts } from '../../utils/dummyData';
import { useCartStore } from '../../store/cartStore';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';

const PAGE_SIZE = 8;

const ALL_CATEGORIES = ['Tất cả', ...Array.from(new Set(dummyProducts.map(p => p.category)))];

const tagColors = {
  'Bán chạy': 'bg-foreground text-background',
  'Mới':      'bg-blue-600 text-white',
  'Sale':     'bg-red-600 text-white',
  'Sale 20%': 'bg-red-600 text-white',
  'Sale 25%': 'bg-red-600 text-white',
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image 3:4 */}
      <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden mb-3">
        <motion.img
          src={product.image}
          alt={product.name}
          animate={{ opacity: hovered && product.imageAlt ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {product.imageAlt && (
          <motion.img
            src={product.imageAlt}
            alt={product.name + ' alt'}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Tag */}
        {product.tag && (
          <span className={cn('absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 z-10', tagColors[product.tag] ?? 'bg-foreground text-background')}>
            {product.tag}
          </span>
        )}

        {/* Low stock warning */}
        {product.stock <= 30 && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-1 rounded-full z-10">
            Còn {product.stock}
          </span>
        )}

        {/* Add to cart slide-up */}
        <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={handleAdd}
            className={cn(
              'w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors',
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-background/95 backdrop-blur-sm text-foreground hover:bg-foreground hover:text-background'
            )}
          >
            {added ? '✓ Đã thêm' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-bold text-sm">{product.price.toLocaleString('vi-VN')}đ</span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {product.originalPrice.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {product.colors.slice(0, 5).map(c => (
            <span key={c} title={c} className="w-3 h-3 rounded-full border border-border bg-muted" />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[10px] text-muted-foreground self-center">+{product.colors.length - 5}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedGrid = ({ limit }) => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('Tất cả');
  const [showFilter, setShowFilter] = useState(false);

  const filtered = dummyProducts.filter(p =>
    category === 'Tất cả' || p.category === category
  );

  const source = limit ? filtered.slice(0, limit) : filtered;
  const totalPages = Math.ceil(source.length / PAGE_SIZE);
  const paginated = limit ? source : source.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-1">
              {limit ? 'Hàng Mới Về' : 'Tất cả sản phẩm'}
            </h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              {source.length} sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!limit && (
              <button
                onClick={() => setShowFilter(f => !f)}
                className="flex items-center gap-2 text-xs font-semibold border border-border px-4 py-2.5 rounded-full hover:bg-muted transition-colors"
              >
                <SlidersHorizontal size={14} />
                Bộ lọc
              </button>
            )}
            {limit && (
              <button className="text-xs font-bold tracking-widest uppercase border-b-2 border-foreground pb-0.5 hover:text-muted-foreground hover:border-muted-foreground transition-all">
                Xem tất cả →
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-full border transition-all',
                category === cat
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${page}-${category}`}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6"
          >
            {paginated.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </AnimatePresence>

        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>Không có sản phẩm nào trong danh mục này.</p>
          </div>
        )}

        {/* Pagination */}
        {!limit && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-14">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all',
                  p === page
                    ? 'bg-foreground text-background'
                    : 'border border-border hover:bg-muted'
                )}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Page info */}
        {!limit && totalPages > 1 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Trang {page} / {totalPages} — Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, source.length)} trong {source.length} sản phẩm
          </p>
        )}
      </div>
    </section>
  );
};

export default FeaturedGrid;
