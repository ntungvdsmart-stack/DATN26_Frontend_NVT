import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const HeroSection = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // Parallax effect for background
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Stagger Text Animation
  const textContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const textItem = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section ref={ref} className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden bg-black">
      {/* Background Image with Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Fashion Hero" 
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-20 md:ml-[10%]">
        <motion.div 
          variants={textContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl text-white"
        >
          <motion.p variants={textItem} className="uppercase tracking-[0.3em] text-sm md:text-base font-semibold mb-6">
            BỘ SƯU TẬP MỚI — THU ĐÔNG 2026
          </motion.p>
          <motion.h1 variants={textItem} className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
            REDEFINE <br /> <span className="font-light italic">ELEGANCE.</span>
          </motion.h1>
          <motion.div variants={textItem}>
            <button className="bg-white text-black px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-white/90 hover:scale-105 transition-all">
              Khám phá ngay
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
