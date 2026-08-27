import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, User, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { items, setIsOpen } = useCartStore();
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full max-w-xs bg-muted/50 px-4 py-2 rounded-full border border-border/50">
            <Search size={16} strokeWidth={1.5} />
            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="bg-transparent border-none outline-none text-xs w-full text-foreground" />
          </div>
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
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase border border-border px-3 py-1.5 rounded-full text-muted-foreground">
                <User size={14} /> {user.role}
              </div>
            </div>
          )}

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
          { to: '/store/women', label: 'Nữ' },
          { to: '/store/men', label: 'Nam' },
          { to: '/store/accessories', label: 'Phụ kiện' },
          { to: '/store/sale', label: 'Khuyến mãi', className: 'text-red-600' },
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
              
              <div className="border-t border-border/40 mt-2 pt-4">
                {!user || user.role === 'guest' ? (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-foreground font-bold">
                    <User size={16} /> Đăng nhập / Đăng ký
                  </Link>
                ) : (
                  <>
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
