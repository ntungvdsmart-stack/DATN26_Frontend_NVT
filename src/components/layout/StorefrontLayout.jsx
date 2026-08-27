import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CartDrawer from '../shared/CartDrawer';
import ChatbotWidget from '../shared/ChatbotWidget';
import { ArrowRight, Globe, Smartphone, Mail, MessageCircle } from 'lucide-react';

const StorefrontLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Top Announcement Bar */}
      <div className="bg-foreground text-background py-2 px-4 text-center text-[10px] font-bold tracking-[0.2em] uppercase overflow-hidden">
        <span className="inline-block animate-pulse">Miễn phí vận chuyển cho đơn hàng từ 500.000đ — Nhập mã: FREESHIP</span>
      </div>
      
      <Navbar />
      <CartDrawer />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-card py-16 md:py-24 mt-16 md:mt-24 border-t border-border transition-colors duration-300">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          <div className="flex flex-col gap-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-lg rounded">FS</div>
              FashionOS
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed pr-4">
              Tái định nghĩa phong cách thời trang tối giản. Chúng tôi tin rằng sự đơn giản là đỉnh cao của vẻ đẹp hiện đại.
            </p>
            <div className="flex gap-4 text-foreground/70">
              <a href="#" className="hover:text-foreground transition-colors"><Globe size={20} /></a>
              <a href="#" className="hover:text-foreground transition-colors"><Smartphone size={20} /></a>
              <a href="#" className="hover:text-foreground transition-colors"><Mail size={20} /></a>
              <a href="#" className="hover:text-foreground transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-foreground">Sản phẩm</h4>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Hàng mới về</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Bộ sưu tập Nữ</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Bộ sưu tập Nam</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Phụ kiện & Giày</a></li>
              <li><a href="#" className="text-red-500 font-bold hover:translate-x-1 inline-block transform duration-200">Săn Sale Khủng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-6 text-foreground">Hỗ trợ khách hàng</h4>
            <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Chính sách vận chuyển</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Đổi & trả hàng</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Theo dõi đơn hàng</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors hover:translate-x-1 inline-block transform duration-200">Liên hệ với chúng tôi</a></li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase tracking-[0.15em] text-xs mb-2 text-foreground">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-2">Đăng ký để nhận voucher 10% và cập nhật bộ sưu tập mới nhất.</p>
            <form className="relative group" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email của bạn..." 
                className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-foreground transition-colors rounded-none" 
              />
              <button 
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors"
              >
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-6 mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>© 2026 FashionOS. Đồ án tốt nghiệp.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-foreground transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookie</a>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
};

export default StorefrontLayout;
