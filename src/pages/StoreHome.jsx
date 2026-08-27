import React from 'react';
import HeroSlider from '../components/home/HeroSlider';
import FeaturedGrid from '../components/home/FeaturedGrid';
import { motion } from 'framer-motion';

const categories = [
  { name: 'Nữ', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80', link: '#' },
  { name: 'Nam', img: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600&q=80', link: '#' },
  { name: 'Phụ Kiện', img: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80', link: '#' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const StoreHome = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Slider — replaces static HeroSection */}
      <HeroSlider />

      {/* Categories */}
      <section className="py-16 px-4 container mx-auto max-w-7xl">
        <motion.h2
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={fadeUp}
          className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-center"
        >
          Danh Mục Nổi Bật
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.name}
              href={cat.link}
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } } }}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                <h3 className="text-white text-2xl font-black uppercase tracking-widest mb-3">{cat.name}</h3>
                <span className="text-white text-xs font-semibold tracking-[0.2em] uppercase border-b border-white/70 pb-0.5 group-hover:border-white transition-colors">
                  Khám phá →
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <div className="border-t border-border" id="products">
        <FeaturedGrid />
      </div>

      {/* Editorial / Brand Story */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="aspect-[4/5] overflow-hidden bg-muted"
          >
            <img
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85"
              alt="Editorial"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
            variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.7, delay: 0.2, ease: 'easeOut' } } }}
            className="flex flex-col gap-6"
          >
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-muted-foreground">Câu chuyện thương hiệu</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-tight">
              Art of<br /><span className="font-light italic">Minimalism.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Mỗi thiết kế đều được tinh giản để tôn vinh đường nét cơ thể. Không chi tiết thừa — chỉ tập trung vào chất liệu, phom dáng và cảm giác khi mặc.
            </p>
            <button className="self-start uppercase text-sm font-bold tracking-widest border-b-2 border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-all mt-2">
              Tìm hiểu thêm →
            </button>
          </motion.div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-foreground text-background py-16 px-4 text-center relative overflow-hidden">
        <p className="text-xs tracking-[0.4em] uppercase mb-4 opacity-60">Ưu đãi đặc biệt</p>
        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-6">Giảm 20% Đơn Đầu Tiên</h2>
        <p className="text-sm mb-8 opacity-70">Nhập code <strong>FASHIONOS20</strong> khi thanh toán</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="border border-background/50 text-background px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-background hover:text-foreground transition-colors">
            Mua sắm ngay
          </button>
          
          {/* Nút Test nhanh theo yêu cầu */}
          <a 
            href="/login"
            className="flex items-center gap-2 bg-background text-foreground px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-muted transition-colors shadow-xl"
          >
            Đăng nhập / Admin →
          </a>
        </div>
      </section>
    </div>
  );
};

export default StoreHome;
