import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 0,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=85',
    tag: 'Bộ sưu tập mới — Thu Đông 2026',
    lines: ['REDEFINE', 'ELEGANCE.'],
    italic: 1,
    cta: 'Khám phá ngay',
    align: 'left',
  },
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85',
    tag: 'Minimalist Collection',
    lines: ['LESS IS', 'MORE.'],
    italic: -1,
    cta: 'Xem bộ sưu tập',
    align: 'right',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1800&q=85',
    tag: 'Phụ kiện cao cấp',
    lines: ['STYLE YOUR', 'STORY.'],
    italic: -1,
    cta: 'Mua sắm ngay',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1800&q=85',
    tag: 'Dành cho phái mạnh',
    lines: ['MODERN', 'MANHOOD.'],
    italic: -1,
    cta: 'Khám phá Nam',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&q=85',
    tag: 'Lookbook Nổi Bật',
    lines: ['URBAN', 'CHIC.'],
    italic: 0,
    cta: 'Mua ngay',
    align: 'right',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&q=85',
    tag: 'Xu hướng mới',
    lines: ['STAY', 'AHEAD.'],
    italic: 1,
    cta: 'Xem chi tiết',
    align: 'center',
  },
];

const AUTOPLAY_DELAY = 3000;

const slideVariants = {
  enter: (dir) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.77, 0, 0.175, 1] },
  },
  exit: (dir) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0,
    transition: { duration: 0.65, ease: [0.77, 0, 0.175, 1] },
  }),
};

const textContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};
const textLine = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const goTo = (idx, direction) => {
    setDir(direction);
    setCurrent(idx);
  };

  const next = () => {
    const nextIdx = (current + 1) % slides.length;
    goTo(nextIdx, 1);
  };

  const prev = () => {
    const prevIdx = (current - 1 + slides.length) % slides.length;
    goTo(prevIdx, -1);
  };

  // Autoplay using setInterval — most reliable approach
  useEffect(() => {
    if (paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
      setDir(1);
    }, AUTOPLAY_DELAY);

    return () => clearInterval(intervalRef.current);
  }, [paused]);

  const slide = slides[current];

  const alignClass =
    slide.align === 'right'
      ? 'md:items-end md:text-right md:mr-[8%]'
      : slide.align === 'center'
      ? 'items-center text-center'
      : 'md:items-start md:ml-[8%]';

  // Progress bar
  const ProgressBar = ({ active }) => (
    <div className="h-0.5 flex-1 bg-white/25 overflow-hidden">
      {active && (
        <motion.div
          key={current}
          className="h-full bg-white"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: AUTOPLAY_DELAY / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </div>
  );

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'clamp(350px, 65vh, 600px)' }}
    >
      {/* Slide Images */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={current}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          <img
            src={slide.image}
            alt={slide.lines.join(' ')}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Text */}
      <div className={`absolute inset-0 z-20 flex flex-col justify-end pb-20 sm:pb-24 px-6 items-start ${alignClass}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`txt-${current}`}
            variants={textContainer}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-white"
          >
            <motion.p variants={textLine} className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3 opacity-70">
              {slide.tag}
            </motion.p>

            {slide.lines.map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.h1
                  variants={textLine}
                  className={`text-[clamp(2.5rem,8vw,7rem)] font-black uppercase tracking-tighter leading-[0.9] block
                    ${i === slide.italic ? 'font-light italic' : ''}`}
                >
                  {line}
                </motion.h1>
              </div>
            ))}

            <motion.div variants={textLine} className="mt-7">
              <button className="bg-white text-black px-7 py-3.5 text-xs font-bold tracking-[0.18em] uppercase hover:bg-white/90 active:scale-95 transition-all">
                {slide.cta}
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      {[{ onClick: prev, side: 'left-4', Icon: ChevronLeft }, { onClick: next, side: 'right-4', Icon: ChevronRight }].map(({ onClick, side, Icon }) => (
        <button
          key={side}
          onClick={onClick}
          className={`absolute ${side} top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white transition-all`}
        >
          <Icon size={20} />
        </button>
      ))}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-3 px-6 pb-5">
        {/* Progress Bars */}
        <div className="flex gap-1.5 flex-1">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              className="flex-1 group py-2"
            >
              <ProgressBar active={i === current} />
            </button>
          ))}
        </div>
        {/* Counter */}
        <span className="text-white/50 text-xs font-mono tracking-widest flex-shrink-0">
          {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </span>
      </div>
    </section>
  );
};

export default HeroSlider;
