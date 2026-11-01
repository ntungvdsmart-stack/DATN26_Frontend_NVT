import ProductImage from '../components/shared/ProductImage';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Heart } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import productApi from '../api/productApi';
import axiosClient from '../api/axiosClient';
import { useWishlistStore } from '../store/wishlistStore';
import { cn } from '../lib/utils';
import { matchesProduct } from '../lib/search';
import { categoryDescendants } from '../lib/categoryFilter';

const StoreProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceSort, setPriceSort] = useState(searchParams.get('sort') || '');

  const { toggleItem, isInWishlist } = useWishlistStore();

  const handleToggleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product);
  };

  // Cập nhật lại khi URL thay đổi (nhấn link từ Navbar)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedCategory(params.get('category_id') || params.get('category') || '');
    setSearchTerm(params.get('search') || '');
    setPriceSort(params.get('sort') || '');
  }, [location.search]);

  useEffect(() => { setPage(1); }, [searchTerm, selectedCategory, selectedBrand, priceSort]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, categoryRes] = await Promise.all([productApi.getAllPublic(), axiosClient.get('/products/categories')]);
        setCategoryTree(categoryRes.data || []);
        if (prodRes && prodRes.success) {
          setProducts(prodRes.data);
          
          const brnds = new Map();
          prodRes.data.forEach(p => {
            if (p.brand_name) brnds.set(p.brand_name, p.brand_name);
          });
          setBrands(Array.from(brnds.values()));
        }
      } catch (error) {
        setLoadError(true);
        console.error('Lỗi tải dữ liệu sản phẩm', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const categoryIds = categoryDescendants(categoryTree, selectedCategory);
  const selectedCategoryName = categoryTree.find(category => String(category.category_id) === selectedCategory)?.category_name || selectedCategory;
  const changeCategory = value => {
    setSelectedCategory(value);
    const params = new URLSearchParams(location.search);
    params.delete('category'); params.delete('category_id');
    if (value) params.set('category_id', value);
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };
  const filteredProducts = products.filter(p => {
    const matchSearch = matchesProduct(p, searchTerm);
    const matchCat = !selectedCategory || categoryIds.has(String(p.category_id));
    const matchBrand = selectedBrand ? p.brand_name === selectedBrand : true;
    return matchSearch && matchCat && matchBrand && (priceSort !== 'best-selling' || Number(p.sold_count) > 0);
  }).sort((a, b) => {
    if (priceSort === 'asc') return a.base_price - b.base_price;
    if (priceSort === 'desc') return b.base_price - a.base_price;
    if (priceSort === 'best-selling') return Number(b.sold_count) - Number(a.sold_count) || b.product_id - a.product_id;
    return 0; // default order
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / 24));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div className="catalog-page bg-background min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{priceSort === 'best-selling' ? 'Sản phẩm bán chạy' : selectedCategoryName || 'Bộ sưu tập'}</h1>
            <p className="text-muted-foreground mt-2">Khám phá các sản phẩm mới nhất từ FashionOS</p>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{filteredProducts.length} Sản phẩm</p>
        </div>

        {/* Filters */}
        <div className="catalog-filters grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-8 p-4 sm:p-5 rounded-2xl border border-border bg-card">
          {/* Search */}
          <div className="relative col-span-1 md:col-span-4 lg:col-span-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
            />
          </div>

          <div className="col-span-1 relative">
            <select 
              value={categoryTree.find(c => String(c.category_id) === selectedCategory || c.category_name === selectedCategory)?.category_id || selectedCategory} onChange={e => changeCategory(e.target.value)}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categoryTree.map(c => <option key={c.category_id} value={String(c.category_id)}>{c.parent_id ? '↳ ' : ''}{c.category_name}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">▼</div>
          </div>

          <div className="col-span-1 relative">
            <select 
              value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">▼</div>
          </div>

          <div className="col-span-1 relative">
            <select 
              value={priceSort} onChange={e => setPriceSort(e.target.value)}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="">Sắp xếp: Mới nhất</option>
              <option value="best-selling">Bán chạy nhất</option>
              <option value="asc">Giá: Thấp đến Cao</option>
              <option value="desc">Giá: Cao đến Thấp</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">▼</div>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted/60 mb-4 rounded-md"></div>
                <div className="h-3 bg-muted/60 w-1/3 mb-2 rounded"></div>
                <div className="h-4 bg-muted/60 w-3/4 mb-2 rounded"></div>
                <div className="h-4 bg-muted/60 w-1/2 rounded"></div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div role="alert" className="text-center py-16 border border-border">Không tải được sản phẩm. <button onClick={() => window.location.reload()} className="underline">Tải lại</button></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 border border-border rounded-2xl">
            <p className="text-xl font-medium text-muted-foreground">Không tìm thấy sản phẩm nào phù hợp.</p>
            {selectedCategory && !products.some(product => categoryIds.has(String(product.category_id))) && <p className="mt-3 px-4 text-sm text-muted-foreground">Danh mục {selectedCategoryName} chưa có sản phẩm được phân loại.</p>}
            <button onClick={() => {setSearchTerm(''); changeCategory(''); setSelectedBrand(''); setPriceSort('');}} className="mt-4 text-primary underline underline-offset-4">Xóa bộ lọc</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
            {filteredProducts.slice((page - 1) * 24, page * 24).map((product, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.2) }}
                key={product.product_id} 
                className="catalog-product group cursor-pointer"
                onClick={() => navigate(`/store/products/${product.product_id}`)}
              >
                <div className="aspect-[3/4] mb-3 bg-muted overflow-hidden relative rounded-xl shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <ProductImage loading="lazy"
                    src={product.primary_image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect fill="%23f3f4f6" width="300" height="400"/><text fill="%239ca3af" font-family="sans-serif" font-size="16" dy="10.5" font-weight="bold" x="50%" y="50%" text-anchor="middle">FashionOS</text></svg>'} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Badge Mới */}
                  {(priceSort === 'best-selling' || Date.now() - new Date(product.created_at).getTime() < 14 * 86400000) && (
                    <div className="absolute top-3 left-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-md">
                      {priceSort === 'best-selling' ? 'Bán chạy' : 'Mới'}
                    </div>
                  )}
                  {/* Wishlist Button */}
                  <button
                    aria-label={isInWishlist(product.product_id) ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                    onClick={(e) => handleToggleWishlist(e, product)}
                    className={cn(
                      'absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-20',
                      isInWishlist(product.product_id) ? 'bg-rose-500/10 text-rose-500' : 'bg-background/50 text-foreground hover:bg-background'
                    )}
                  >
                    <Heart size={16} className={cn(isInWishlist(product.product_id) && 'fill-rose-500')} />
                  </button>
                </div>
                <div className="space-y-1">
                  {product.brand_name && (
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{product.brand_name}</p>
                  )}
                  <h3 className="font-semibold text-sm leading-relaxed tracking-tight group-hover:text-primary transition-colors line-clamp-2"><Link to={`/store/products/${product.product_id}`} onClick={event => event.stopPropagation()}>{product.product_name}</Link></h3>
                  <p className="font-semibold text-base text-foreground">{Number(product.base_price).toLocaleString('vi-VN')}đ</p>
                  {Number(product.sold_count) > 0 && <p className="text-xs text-muted-foreground">Đã bán {Number(product.sold_count).toLocaleString('vi-VN')}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {!isLoading && filteredProducts.length > 24 && <nav aria-label="Trang sản phẩm" className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button className="border rounded-lg px-4 py-3 disabled:opacity-40" disabled={page <= 1} onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Trước</button>
          <span>Trang {page}/{Math.ceil(filteredProducts.length / 24)}</span>
          <button className="border rounded-lg px-4 py-3 disabled:opacity-40" disabled={page >= Math.ceil(filteredProducts.length / 24)} onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Sau</button>
        </nav>}
      </div>
    </div>
  );
};

export default StoreProducts;
