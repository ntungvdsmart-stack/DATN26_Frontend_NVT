import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Loader2, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import productApi from '../api/productApi';
import { useWishlistStore } from '../store/wishlistStore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const StoreProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceSort, setPriceSort] = useState(''); // 'asc' or 'desc'

  const { items: wishlistItems, toggleItem, isInWishlist } = useWishlistStore();

  const handleToggleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    toast.error('Vui lòng vào trang chi tiết để chọn màu/size yêu thích!');
  };

  // Cập nhật lại khi URL thay đổi (nhấn link từ Navbar)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSelectedCategory(params.get('category') || '');
    setSearchTerm(params.get('search') || '');
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const prodRes = await productApi.getAllPublic();
        if (prodRes && prodRes.success) {
          setProducts(prodRes.data);
          
          const cats = new Map();
          const brnds = new Map();
          prodRes.data.forEach(p => {
            if (p.category_name) cats.set(p.category_name, p.category_name);
            if (p.brand_name) brnds.set(p.brand_name, p.brand_name);
          });
          setCategories(Array.from(cats.values()));
          setBrands(Array.from(brnds.values()));
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu sản phẩm', error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory ? p.category_name === selectedCategory : true;
    const matchBrand = selectedBrand ? p.brand_name === selectedBrand : true;
    return matchSearch && matchCat && matchBrand;
  }).sort((a, b) => {
    if (priceSort === 'asc') return a.base_price - b.base_price;
    if (priceSort === 'desc') return b.base_price - a.base_price;
    return 0; // default order
  });

  return (
    <div className="bg-background min-h-screen pb-20 pt-10">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Bộ sưu tập</h1>
            <p className="text-muted-foreground mt-2">Khám phá các sản phẩm mới nhất từ FashionOS</p>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{filteredProducts.length} Sản phẩm</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
              value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3.5 bg-background border border-border rounded-xl shadow-sm outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
              <option value="">Sắp xếp: Mặc định</option>
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-muted/50 border border-border">
            <p className="text-xl font-medium text-muted-foreground">Không tìm thấy sản phẩm nào phù hợp.</p>
            <button onClick={() => {setSearchTerm(''); setSelectedCategory(''); setSelectedBrand(''); setPriceSort('');}} className="mt-4 text-primary underline underline-offset-4">Xóa bộ lọc</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={product.product_id} 
                className="group cursor-pointer"
                onClick={() => navigate(`/store/products/${product.product_id}`)}
              >
                <div className="aspect-[3/4] mb-4 bg-muted overflow-hidden relative rounded-xl shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <img 
                    src={product.primary_image || 'https://via.placeholder.com/300x400?text=No+Image'} 
                    alt={product.product_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Badge Mới */}
                  {idx < 3 && (
                    <div className="absolute top-3 left-3 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-md">
                      Mới
                    </div>
                  )}
                  {/* Wishlist Button */}
                  <button
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
                  <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">{product.product_name}</h3>
                  <p className="font-medium text-sm text-muted-foreground">{Number(product.base_price).toLocaleString('vi-VN')}đ</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreProducts;
