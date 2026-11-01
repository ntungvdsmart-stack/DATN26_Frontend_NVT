import ProductImage from '../shared/ProductImage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import productApi from '../../api/productApi';

const PAGE_SIZE = 8;

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
  const navigate = useNavigate();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const [hovered, setHovered] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      product_id: product.id,
      product_name: product.name,
      base_price: product.price,
      primary_image: product.image,
      category_name: product.category
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/store/products/${product.id}`);
  };

  return (
    <motion.div
      variants={itemVariants}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/store/products/${product.id}`)}
    >
      {/* Image 3:4 */}
      <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden mb-3">
        <ProductImage animated
          loading="lazy"
          src={product.image}
          alt={product.name}
          
          animate={{ opacity: hovered && product.imageAlt ? 0 : 1 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {product.imageAlt && (
          <ProductImage animated
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
          <span className="absolute top-12 right-3 text-[10px] font-semibold text-amber-600 bg-amber-50/90 dark:bg-amber-950/90 backdrop-blur-sm px-2 py-0.5 rounded-full z-10 border border-amber-200 dark:border-amber-800">
            Còn {product.stock}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          aria-label={isWishlisted ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          onClick={handleToggleWishlist}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20',
            isWishlisted ? 'bg-rose-500/10 text-rose-500' : 'bg-background/50 text-foreground hover:bg-background'
          )}
        >
          <Heart size={16} className={cn(isWishlisted && 'fill-rose-500')} />
        </button>

        {/* Add to cart slide-up */}
        <div className="absolute bottom-0 left-0 w-full md:translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={handleAdd}
            className={cn(
              'w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors',
              'bg-background/95 backdrop-blur-sm text-foreground hover:bg-foreground hover:text-background'
            )}
          >
            Xem Chi Tiết
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category || 'Thời trang'}</p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2"><Link to={`/store/products/${product.id}`} onClick={event => event.stopPropagation()}>{product.name}</Link></h3>
        {product.sold > 0 && <p className="text-xs text-muted-foreground">Đã bán {product.sold.toLocaleString('vi-VN')}</p>}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="font-bold text-sm">{Number(product.price).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedGrid = ({ limit, bestSellers = false }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('Tất cả');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await productApi.getAllPublic();
        if (res && res.success) {
          setProducts(res.data);
        }
      } catch (error) {
        setLoadError(true);
        console.error('Lỗi lấy danh sách sản phẩm:', error);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const ALL_CATEGORIES = ['Tất cả', ...Array.from(new Set(products.map(p => p.category_name).filter(Boolean)))];

  const filtered = products.filter(p =>
    (category === 'Tất cả' || p.category_name === category) && (!bestSellers || Number(p.sold_count) > 0)
  ).sort((a, b) => bestSellers ? Number(b.sold_count) - Number(a.sold_count) || b.product_id - a.product_id : 0);

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
              {bestSellers ? 'Sản phẩm bán chạy' : limit ? 'Hàng Mới Về' : 'Tất cả sản phẩm'}
            </h2>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              {source.length} sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!limit && (
              <button
                onClick={() => navigate('/store/products')}
                className="flex items-center gap-2 text-xs font-semibold border border-border px-4 py-2.5 rounded-full hover:bg-muted transition-colors"
              >
                <SlidersHorizontal size={14} />
                Bộ lọc
              </button>
            )}
            {limit && (
              <Link to={bestSellers ? '/store/products?sort=best-selling' : '/store/products'} className="text-xs font-bold tracking-widest uppercase border-b-2 border-foreground pb-0.5 hover:text-muted-foreground hover:border-muted-foreground transition-all">
                Xem tất cả →
              </Link>
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-4 text-sm font-medium">Đang tải sản phẩm...</p>
          </div>
        ) : (
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
                <ProductCard 
                  key={product.product_id} 
                  product={{
                    id: product.product_id,
                    name: product.product_name,
                    category: product.category_name,
                    price: product.base_price,
                    tag: bestSellers ? 'Bán chạy' : undefined,
                    sold: Number(product.sold_count),
                    image: product.primary_image
                  }} 
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!isLoading && paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>{loadError ? 'Không tải được sản phẩm. Vui lòng tải lại trang.' : bestSellers ? 'Chưa có dữ liệu bán hàng hoàn tất trong danh mục này.' : 'Không có sản phẩm nào trong danh mục này.'}</p>
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
