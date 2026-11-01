import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star,
  Package, 
  ShoppingCart, 
  MonitorSmartphone, 
  ClipboardList, 
  CreditCard, 
  Users, 
  Settings, 
  Home,
  Shield,
  Tags,
  Warehouse,
  Tag,
  RefreshCcw,
  HelpCircle,
  Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { routePermissions } from '../../lib/permissions';

const menuItems = [
  { path: '/dashboard', name: 'Tổng quan & Báo cáo', icon: Home, roles: ['admin'] },
  { path: '/pos', name: 'Bán tại quầy', icon: MonitorSmartphone, roles: ['staff'] },
  { path: '/products', name: 'Sản phẩm', icon: Package, roles: ['admin', 'staff'] },
  { path: '/inventory', name: 'Tồn kho chi nhánh', icon: Warehouse, roles: ['admin', 'staff'] },
  { path: '/orders', name: 'Đơn hàng', icon: ClipboardList, roles: ['admin', 'staff'] },
  { path: '/returns', name: 'Đổi/Trả hàng', icon: RefreshCcw, roles: ['admin', 'staff'] },
  { path: '/online', name: 'Bán Online', icon: ShoppingCart, roles: ['admin', 'staff'] },
  { path: '/payments', name: 'Thanh toán', icon: CreditCard, roles: ['admin'] },
  { path: '/reviews', name: '\u0110\u00e1nh gi\u00e1 s\u1ea3n ph\u1ea9m', icon: Star, roles: ['admin', 'staff'] },
  { path: '/admin/promotions', name: 'Khuyến mãi', icon: Tag, roles: ['admin'] },
  { path: '/customers', name: 'Khách hàng', icon: Users, roles: ['admin', 'staff'] },
  { path: '/admin/accounts', name: 'Tài khoản Nội bộ', icon: Shield, roles: ['admin'] },
  { path: '/admin/roles', name: 'Phân quyền vai trò', icon: Shield, roles: ['admin'] },
  { path: '/admin/logs', name: 'Nhật ký hoạt động', icon: ClipboardList, roles: ['admin'] },
  { path: '/admin/branches', name: 'Chi nhánh', icon: Store, roles: ['admin'] },
  { path: '/admin/categories', name: 'Danh mục & TH', icon: Tags, roles: ['admin'] },
  { path: '/admin/faqs', name: 'Câu hỏi thường gặp', icon: HelpCircle, roles: ['admin'] },
  { path: '/admin', name: 'Hệ thống', icon: Settings, roles: ['admin'] },
];

const Sidebar = ({ open = false, onClose }) => {
  const { role, user, can } = useAuth();
  const visibleItems = menuItems.filter(item => item.roles.includes(role) && can(routePermissions[item.path]));

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn("admin-sidebar fixed left-0 top-0 w-[260px] h-dvh border-r border-border bg-background backdrop-blur-xl z-50 flex flex-col p-4", !open && "hidden lg:flex")}
    >
      <div className="flex items-center gap-3 px-3 py-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
          <Package size={20} />
        </div>
        <h2 className="text-xl font-bold tracking-tight">FashionOS</h2>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden group",
                isActive ? "text-primary-foreground bg-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary-foreground/60 rounded-r-full"
                    />
                  )}
                  <Icon size={18} className={cn("transition-colors", isActive ? "text-primary-foreground" : "group-hover:text-foreground")} />
                  <span className="flex-1">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <NavLink 
          to="/profile"
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-3 p-3 rounded-xl border transition-all",
            isActive ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border/50 hover:bg-muted"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold uppercase shrink-0">
            {user?.full_name?.charAt(0) || (role === 'admin' ? 'A' : 'S')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user?.full_name || 'Staff User'}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{role}</p>
          </div>
        </NavLink>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
