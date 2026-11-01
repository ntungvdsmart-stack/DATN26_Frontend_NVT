import { Link, Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CartDrawer from '../shared/CartDrawer';
import WishlistDrawer from '../shared/WishlistDrawer';
import ChatbotWidget from '../shared/ChatbotWidget';
import ScrollToTop from '../shared/ScrollToTop';
import { useAuth } from '../../context/AuthContext';

export default function StorefrontLayout() {
  const { user } = useAuth();
  return <div className="storefront-shell min-h-screen flex flex-col bg-background text-foreground">
    <div className="bg-foreground text-background py-2 px-4 text-center text-xs">Mua sắm online · Theo dõi đơn hàng · Hỗ trợ tại chi nhánh</div>
    <Navbar /><CartDrawer /><WishlistDrawer />
    <div className="flex-1"><Outlet /></div>
    <footer className="store-footer bg-card mt-12 border-t border-border">
      <div className="container mx-auto px-5 sm:px-8 py-12 sm:py-16 flex flex-col sm:flex-row justify-between gap-8">
        <div><p className="text-2xl font-black">FashionOS</p><p className="text-sm text-muted-foreground mt-2">Chọn sản phẩm phù hợp, mua sắm và quản lý đơn hàng dễ dàng.</p></div>
        <nav aria-label="Hỗ trợ mua sắm" className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Link to="/store/products" className="hover:underline">Sản phẩm</Link>
          <Link to="/store/orders" className="hover:underline">Đơn hàng của tôi</Link>
          <Link to="/store/faq" className="hover:underline">Câu hỏi thường gặp</Link>
          <Link to="/store/profile" className="hover:underline">Tài khoản của tôi</Link>
        </nav>
      </div>
    </footer>
    <ChatbotWidget key={`${user?.role || 'guest'}-${user?.id || user?.customer_id || user?.account_id || ''}`} /><ScrollToTop />
  </div>;
}
