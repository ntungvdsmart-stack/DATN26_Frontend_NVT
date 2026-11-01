import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Sun, Moon, LogOut, Menu, X, Heart, Package } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import ProductSearch from '../shared/ProductSearch';
import NotificationBell from '../shared/NotificationBell';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items, setIsOpen } = useCartStore();
  const { items: wishlistItems, setIsOpen: setWishlistOpen } = useWishlistStore();
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const [mobileOpen, setMobileOpen] = useState(false);


  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border transition-colors">
      {/* Desktop Header */}
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4">

        {/* Left — Logo */}
        <div className="flex items-center gap-4 flex-1">
          <button
            aria-label={mobileOpen ? 'Đóng menu cửa hàng' : 'Mở menu cửa hàng'} aria-expanded={mobileOpen}
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

        <div className="hidden md:flex flex-1 min-w-0 max-w-md">
          <ProductSearch />
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

          <Link to="/store/orders" className="flex items-center gap-1.5 text-xs font-semibold text-foreground rounded-lg p-2 hover:bg-muted" aria-label="Đơn hàng của tôi">
            <Package size={20} /><span className="hidden lg:inline">Đơn hàng</span>
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

      <div className="md:hidden px-4 pb-3"><ProductSearch onNavigate={() => setMobileOpen(false)} /></div>
      {/* Desktop Nav */}
      <nav className="hidden md:flex justify-center gap-10 py-3 border-t border-border/40 text-[11px] font-bold tracking-[0.15em] uppercase">
        {[
          { to: '/store', label: 'Trang chủ' },
          { to: '/store/products', label: 'Sản phẩm' },
          { to: '/store/products?sort=best-selling', label: 'Bán chạy' },
          { to: '/store/orders', label: 'Đơn hàng của tôi' },
          { to: '/store/faq', label: 'Hỏi đáp' },
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
            className="md:hidden max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain border-t border-border bg-background"
          >
            <div className="flex flex-col py-4 px-6 gap-4 text-sm font-semibold">
              <Link to="/store/products?sort=best-selling" onClick={() => setMobileOpen(false)} className="py-2 border-b border-border/40">Sản phẩm bán chạy</Link>

              {[['Trang chủ', '/store'], ['Sản phẩm', '/store/products'], ['Đơn hàng của tôi', '/store/orders'], ['Hỏi đáp', '/store/faq']].map(([label, path]) => (
                <Link key={label} to={path} onClick={() => setMobileOpen(false)} className="py-2 border-b border-border/40 text-foreground hover:text-muted-foreground transition-colors">
                  {label}
                </Link>
              ))}
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
                    <button onClick={() => { setMobileOpen(false); logout(); }} className="flex items-center gap-2 text-muted-foreground py-2 text-left w-full">
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
