import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, UserCheck, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  console.log('🔥🔥🔥 [Login.jsx] CODE MỚI ĐÃ ĐƯỢC NẠP - Phiên bản có gọi API 🔥🔥🔥');
  const { login, register } = useAuth(); // Dùng hàm login thống nhất
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State Biểu mẫu
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // State Giao diện
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Xóa form khi chuyển tab
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Validate form đăng ký
  const validateRegister = () => {
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên');
      return false;
    }
    if (name.trim().length < 2) {
      setErrorMsg('Họ và tên phải có ít nhất 2 ký tự');
      return false;
    }
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Email không hợp lệ');
      return false;
    }
    if (phone && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
      setErrorMsg('Số điện thoại không hợp lệ (VD: 0912345678)');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  // Xử lý submit form (Đăng nhập/Đăng ký)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // === ĐĂNG NHẬP ===
        const res = await login(email, password); // Gọi hàm login thống nhất
        if (res && res.success) {
          setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
          // Phân luồng dựa trên role trả về
          setTimeout(() => {
             if (res.role === 'admin' || res.role === 'staff') {
                navigate('/dashboard'); // Chuyển staff/admin vào dashboard
             } else {
                navigate('/store'); // Chuyển khách hàng vào store
             }
          }, 800);
        } else {
          setErrorMsg(res?.message || 'Đăng nhập thất bại');
        }
      } else {
        // === ĐĂNG KÝ ===
        if (!validateRegister()) {
          setIsLoading(false);
          return;
        }
        
        const res = await register(name.trim(), email.trim(), password, phone.trim() || undefined);
        if (res && res.success) {
          // Tự động đăng nhập sau khi đăng ký thành công
          const loginRes = await login(email.trim(), password);
          if (loginRes && loginRes.success) {
            setSuccessMsg('Tạo tài khoản thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/store'), 800);
          } else {
            // Đăng ký OK nhưng auto-login lỗi → chuyển sang tab đăng nhập
            setSuccessMsg('Tạo tài khoản thành công! Hãy đăng nhập.');
            setTimeout(() => {
              setIsLogin(true);
              setSuccessMsg('');
            }, 1500);
          }
        } else {
          setErrorMsg(res?.message || 'Đăng ký thất bại');
        }
      }
    } catch (err) {
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('[Login] Lỗi không mong đợi:', err);
    }
    
    setIsLoading(false);
  };

  // Xử lý đăng nhập nhanh cho Dev
  const handleDevLogin = async (devRole) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    // Thông tin đăng nhập tương ứng với tài khoản trong CSDL
    const identifier = devRole === 'admin' ? 'admin@gmail.com' : 'staff1';
    const devPassword = devRole === 'admin' ? 'admin123' : '123';
    
    try {
      const res = await login(identifier, devPassword); // Dùng hàm login thống nhất
      if (res && res.success) {
        setSuccessMsg(`Đăng nhập ${devRole} thành công!`);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setErrorMsg(`Đăng nhập ${devRole} thất bại: ${res?.message || 'Không rõ lỗi'}. Cần tạo sẵn tài khoản trong CSDL.`);
      }
    } catch (err) {
      setErrorMsg(`Lỗi kết nối khi đăng nhập ${devRole}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Nửa trái - Hình ảnh thương hiệu */}
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
              alt="FashionOS"
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

      {/* Nửa phải - Form đăng nhập / đăng ký */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10 bg-background lg:bg-transparent">
        {/* Hình nền mobile */}
        <div className="absolute inset-0 z-0 lg:hidden opacity-10">
          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" className="w-full h-full object-cover" alt="bg" />
        </div>

        <motion.div 
          className="w-full max-w-sm mx-auto relative z-10 bg-card lg:bg-transparent p-8 lg:p-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-border/50 lg:border-none backdrop-blur-xl lg:backdrop-blur-none"
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          {/* Logo trên mobile */}
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
                onClick={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }} 
                className="text-foreground font-bold hover:underline transition-all underline-offset-4"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>
          
          {/* Thông báo lỗi */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg font-medium flex items-start gap-2"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Thông báo thành công */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-lg font-medium flex items-start gap-2"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

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
              {/* Trường Họ tên (chỉ hiện khi Đăng ký) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Họ và tên <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:border-foreground focus:ring-1 focus:ring-foreground/20 outline-none transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              )}

              {/* Trường Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:border-foreground focus:ring-1 focus:ring-foreground/20 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>

              {/* Trường Số điện thoại (chỉ hiện khi Đăng ký) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:border-foreground focus:ring-1 focus:ring-foreground/20 outline-none transition-all"
                    placeholder="0912345678 (không bắt buộc)"
                  />
                </div>
              )}

              {/* Trường Mật khẩu */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mật khẩu <span className="text-red-500">*</span></label>
                  {isLogin && <a href="#" className="text-xs font-semibold hover:underline text-muted-foreground hover:text-foreground transition-colors">Quên mật khẩu?</a>}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-muted/50 border border-border rounded-lg focus:border-foreground focus:ring-1 focus:ring-foreground/20 outline-none transition-all"
                    placeholder="Tối thiểu 6 ký tự"
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

              {/* Trường Xác nhận mật khẩu (chỉ hiện khi Đăng ký) */}
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 bg-muted/50 border rounded-lg focus:ring-1 outline-none transition-all ${
                        confirmPassword && confirmPassword !== password 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : confirmPassword && confirmPassword === password 
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20' 
                            : 'border-border focus:border-foreground focus:ring-foreground/20'
                      }`}
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Gợi ý trạng thái khớp mật khẩu */}
                  {confirmPassword && (
                    <p className={`text-xs mt-1 ${confirmPassword === password ? 'text-green-600' : 'text-red-500'}`}>
                      {confirmPassword === password ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                    </p>
                  )}
                </div>
              )}

              {/* Nút Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 bg-foreground text-background text-xs font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-foreground/10 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Khu vực Dev Only */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-2 py-1 rounded">Dev Only</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDevLogin('admin')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 text-blue-600 font-bold text-[11px] uppercase tracking-wider rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20 disabled:opacity-50"
            >
              <Shield size={14} /> Admin
            </button>
            <button 
              onClick={() => handleDevLogin('staff')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/10 text-purple-600 font-bold text-[11px] uppercase tracking-wider rounded-lg hover:bg-purple-500/20 transition-colors border border-purple-500/20 disabled:opacity-50"
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
