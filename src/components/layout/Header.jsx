import { ChatUnreadLink } from '../../context/ChatUnreadContext';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../shared/NotificationBell';

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { logout, role } = useAuth();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="admin-header sticky top-0 z-40 h-[70px] w-full flex items-center justify-between px-4 sm:px-8 bg-background/60 backdrop-blur-md border-b border-border"
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={onMenuClick} aria-label="Mở menu" className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
          <Menu size={24} />
        </button>
        <form onSubmit={event => { event.preventDefault(); navigate(`/products?search=${encodeURIComponent(search.trim())}`); }} className="relative w-[220px] md:w-[300px] hidden sm:block">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Tìm kiếm sản phẩm"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-full text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          title={theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <ChatUnreadLink />
        <NotificationBell role={role} />

        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg font-semibold transition-colors"
          title="Đăng xuất"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Thoát</span>
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
