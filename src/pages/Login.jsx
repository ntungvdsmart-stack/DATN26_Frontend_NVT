import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserCheck, ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default to customer for regular login/register
    login('customer');
    navigate('/store');
  };

  const handleDevLogin = (role) => {
    login(role);
    if (role === 'customer') {
      navigate('/store');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Left Panel - Image/Brand */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
      >
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={isLogin ? 'img1' : 'img2'}
              src={isLogin ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80' : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80'}
              alt="FashionOS Background"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        </div>

        <Link to="/store" className="relative z-10 text-white flex items-center gap-2 w-max group">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl tracking-tighter rounded group-hover:scale-105 transition-transform">
            FS
          </div>
          <span className="font-bold tracking-widest uppercase">FashionOS</span>
        </Link>

        <div className="relative z-10 text-white max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'txt1' : 'txt2'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-[3rem] font-black uppercase tracking-tighter leading-[0.9] mb-4">
                {isLogin ? 'Welcome\nBack.' : 'Join The\nMovement.'}
              </h2>
              <p className="text-white/70 font-medium">
                {isLogin 
                  ? 'Đăng nhập để khám phá các bộ sưu tập giới hạn và quản lý tài khoản của bạn.'
                  : 'Tạo tài khoản để nhận ưu đãi thành viên và trải nghiệm mua sắm cá nhân hóa.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-background lg:bg-transparent">
        {/* Mobile Background */}
        <div className="absolute inset-0 z-0 lg:hidden opacity-10">
          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" className="w-full h-full object-cover" alt="bg" />
        </div>

        <motion.div 
          className="w-full max-w-sm mx-auto relative z-10 bg-card lg:bg-transparent p-8 lg:p-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-border/50 lg:border-none backdrop-blur-xl lg:backdrop-blur-none"
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {/* Mobile Logo */}
          <Link to="/store" className="lg:hidden flex items-center justify-center gap-2 mb-8 w-max mx-auto">
            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black text-xl tracking-tighter rounded">
              FS
            </div>
            <span className="font-bold tracking-widest uppercase">FashionOS</span>
          </Link>

          <div className="text-center lg:text-left mb-8">
            <h3 className="text-2xl font-black tracking-tight mb-2">
              {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-foreground font-bold hover:underline transition-all underline-offset-4"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mật khẩu</label>
                  {isLogin && <a href="#" className="text-xs font-semibold hover:underline">Quên mật khẩu?</a>}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-muted/50 border border-border focus:border-primary outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-4 bg-foreground text-background text-xs font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-foreground/10"
              >
                {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">Dev Only</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDevLogin('admin')}
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-600 font-bold text-[11px] uppercase tracking-wider rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20"
            >
              <Shield size={14} /> Admin
            </button>
            <button 
              onClick={() => handleDevLogin('staff')}
              className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 text-purple-600 font-bold text-[11px] uppercase tracking-wider rounded-lg hover:bg-purple-500/20 transition-colors border border-purple-500/20"
            >
              <UserCheck size={14} /> Staff
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
