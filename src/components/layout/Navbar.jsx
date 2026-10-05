import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Sun, Moon, LogOut, Menu, X, Heart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import productApi from '../../api/productApi';
import NotificationBell from '../shared/NotificationBell';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items, setIsOpen } = useCartStore();
  const { items: wishlistItems, setIsOpen: setWishlistOpen } = useWishlistStore();
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch products once for fast local filtering
    productApi.getAllPublic().then(res => {
      if (res?.success) setAllProducts(res.data);
    }).catch(() => {});

    // Close search when clicking outside
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim() === '' ? [] : allProducts
    .filter(p => p.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/store/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-colors">
      {/* Desktop Header */}
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">

        {/* Left — Logo */}
        <div className="flex items-center gap-4 flex-1">
          <button
            className="md:hidden text-foreground hover:text-muted-foreground transition-colors"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/store" className="text-xl md:text-3xl font-black tracking-tighter uppercase hidden md:block">
            Fashion<span className="font-light">OS</span>
          </Link>
          <Link to="/store" className="text-xl font-black tracking-tighter uppercase md:hidden">
            FS
          </Link>
        </div>

        {/* Center — Search (Desktop) */}
        <div className="hidden md:flex flex-1 justify-center relative" ref={searchRef}>
          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full max-w-xs bg-muted/50 px-4 py-2 rounded-full border border-border/50 relative z-50">
            <Search size={16} strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchSubmit}
              className="bg-transparent border-none outline-none text-xs w-full text-foreground" 
            />
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {isSearchOpen && searchQuery.trim() !== '' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-40 left-1/2 -translate-x-1/2"
              >
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy sản phẩm nào
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {searchResults.map(p => (
                      <div 
                        key={p.product_id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          navigate(`/store/products/${p.product_id}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
                      >
                        <img src={p.primary_image || 'https://via.placeholder.com/40'} alt={p.product_name} className="w-10 h-10 object-cover rounded-md bg-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{p.product_name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{Number(p.base_price).toLocaleString('vi-VN')}đ</p>
                        </div>
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/store/products?search=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchQuery('');
                      }}
                      className="p-3 text-center text-[11px] font-bold text-primary hover:bg-primary/5 cursor-pointer uppercase tracking-widest"
                    >
                      Xem tất cả kết quả
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-3 md:gap-5 flex-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="text-foreground hover:text-muted-foreground transition-colors p-1"
            title={theme === 'light' ? 'Nền tối' : 'Nền sáng'}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
              </motion.div>
            </AnimatePresence>
          </button>

          {/* User / Login state */}
          {!user || user.role === 'guest' ? (
            <Link to="/login" className="hidden md:flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-foreground text-background px-4 py-2 hover:bg-foreground/80 transition-colors">
              Đăng nhập
            </Link>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              {user.role !== 'customer' && (
                <Link to="/dashboard" className="text-[11px] font-bold tracking-widest uppercase text-foreground hover:text-muted-foreground transition-colors mr-2">
                  Admin Dashboard
                </Link>
              )}
              {user.role === 'customer' ? (
                <Link to="/store/profile" className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase border border-border px-3 py-1.5 rounded-full text-foreground hover:bg-muted transition-colors">
                  <User size={14} /> Tài khoản
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase border border-border px-3 py-1.5 rounded-full text-muted-foreground">
                  <User size={14} /> {user.role}
                </div>
              )}
            </div>
          )}

          <Link to="/store/tracking" className="hidden md:block text-[11px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mr-2">
            Tra cứu
          </Link>

          {/* Wishlist */}
          <button onClick={() => setWishlistOpen(true)} className="relative text-foreground hover:text-muted-foreground transition-colors p-1">
            <Heart size={20} strokeWidth={1.5} />
            {wishlistItems.length > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
              >
                {wishlistItems.length}
              </motion.span>
            )}
          </button>

          {user && <NotificationBell />}

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-foreground hover:text-muted-foreground transition-colors group"
          >
            <ShoppingBag size={22} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {user && user.role !== 'guest' && (
            <button
              onClick={logout}
              className="hidden md:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Nav */}
      <nav className="hidden md:flex justify-center gap-10 py-3 border-t border-border/40 text-[11px] font-bold tracking-[0.15em] uppercase">
        {[
          { to: '/store', label: 'Trang chủ' },
          { to: '/store/products', label: 'Hàng mới về' },
          { to: '/store/products?category=Nữ', label: 'Nữ' },
          { to: '/store/products?category=Nam', label: 'Nam' },
          { to: '/store/products?category=Phụ kiện', label: 'Phụ kiện' },
          { to: '/store/products?sale=true', label: 'Khuyến mãi', className: 'text-red-600' },
        ].map(nav => (
          <Link key={nav.to} to={nav.to} className={`hover:text-muted-foreground transition-colors ${nav.className || ''}`}>
            {nav.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="flex flex-col py-4 px-6 gap-4 text-sm font-semibold">
              {['Trang chủ', 'Hàng mới về', 'Nữ', 'Nam', 'Phụ kiện'].map(label => (
                <Link key={label} to="#" onClick={() => setMobileOpen(false)} className="py-2 border-b border-border/40 text-foreground hover:text-muted-foreground transition-colors">
                  {label}
                </Link>
              ))}
              <Link to="#" onClick={() => setMobileOpen(false)} className="py-2 text-red-600 font-bold">Khuyến mãi</Link>
              <Link to="/store/tracking" onClick={() => setMobileOpen(false)} className="block py-4 border-b border-border/50 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Tra cứu đơn hàng
              </Link>
              <div className="py-4 border-b border-border/50">
                {!user || user.role === 'guest' ? (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-foreground font-bold">
                    <User size={16} /> Đăng nhập / Đăng ký
                  </Link>
                ) : (
                  <>
                    {user.role === 'customer' && (
                      <Link to="/store/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-foreground font-bold py-2">
                        <User size={16} /> Tài khoản của tôi
                      </Link>
                    )}
                    {user.role !== 'customer' && (
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-foreground font-bold py-2">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={logout} className="flex items-center gap-2 text-muted-foreground py-2 text-left w-full">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
