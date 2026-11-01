import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle2, User, Lock, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';

// ─── Định nghĩa NGOÀI Login ─────────────────────────────────────────────────
// Đặt ngoài → stable reference → React không unmount/remount → giữ focus
const InputField = ({ icon: Icon, label, required, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
      <Icon size={11} />
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground/70 pl-1">{hint}</p>}
  </div>
);

// Constant style — định nghĩa ngoài để không tạo string mới mỗi render
const INPUT_CLS = "w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:border-foreground focus:ring-1 focus:ring-foreground/20 outline-none transition-all text-sm";

// Trạng thái ban đầu — tách ra ngoài để dùng lại cho reset
const getInitialFields = () => ({
  identifier: localStorage.getItem('rememberedIdentifier') || '',
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
});

// ─── Component Login ──────────────────────────────────────────────────────────
const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── UI state ──
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');

  // ── Form fields gộp vào 1 object: ít useState hơn, ít re-render hơn ──
  const [fields, setFields] = useState(getInitialFields);

  // Helper cập nhật 1 field
  const setField = useCallback((key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Reset toàn bộ form ──
  const resetForm = useCallback(() => {
    setFields(getInitialFields());
    setErrorMsg('');
    setSuccessMsg('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  // ── Validate form đăng ký (useCallback để không tạo lại mỗi render) ──
  const validateRegister = useCallback(() => {
    const { name, email, phone, password, confirmPassword } = fields;
    if (!name.trim())              { setErrorMsg('Vui lòng nhập họ và tên'); return false; }
    if (name.trim().length < 2 || name.trim().length > 150) { setErrorMsg('Họ và tên phải có từ 2 đến 150 ký tự'); return false; }
    if (!email.trim())             { setErrorMsg('Vui lòng nhập email'); return false; }
    if (email.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorMsg('Email không hợp lệ'); return false; }
    if (phone && !/^(0[0-9]{9}|\+84[0-9]{9})$/.test(phone.trim())) {
      setErrorMsg('Số điện thoại không hợp lệ (VD: 0912345678)'); return false;
    }
    if (password.length < 8)       { setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự'); return false; }
    if (new TextEncoder().encode(password).length > 72) { setErrorMsg('Mật khẩu vượt quá giới hạn 72 byte, vui lòng rút ngắn'); return false; }
    if (password !== confirmPassword) { setErrorMsg('Mật khẩu xác nhận không khớp'); return false; }
    return true;
  }, [fields]);

  // ── Submit handler ──
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const { identifier, email, password, name, phone } = fields;

    try {
      if (isLogin) {
        const res = await login(identifier, password);
        if (res?.success) {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedIdentifier', identifier);
            // Không lưu mật khẩu — bảo mật XSS
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedIdentifier');
          }
          setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng...');
          toast.success('Đăng nhập thành công!');
          setTimeout(() => {
            const from = location.state?.from;
            const destination = res.role === 'customer' && from?.pathname?.startsWith('/store/') ? `${from.pathname}${from.search || ''}` : res.homePath || '/store';
            navigate(destination, { replace: true });
          }, 800);
        } else {
          setErrorMsg(res?.message || 'Đăng nhập thất bại');
          toast.error(res?.message || 'Đăng nhập thất bại');
        }
      } else {
        if (!validateRegister()) { setIsLoading(false); return; }
        const res = await register(name.trim(), email.trim(), password, phone.trim() || undefined);
        if (res?.success) {
          setSuccessMsg('Đăng ký thành công! Đang chuyển về trang đăng nhập...');
          toast.success('Đăng ký thành công!');
          setTimeout(() => { 
            setIsLogin(true); 
            resetForm(); 
          }, 1500);
        } else {
          setErrorMsg(res?.message || 'Đăng ký thất bại');
        }
      }
    } catch {
      setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [fields, isLogin, login, register, navigate, validateRegister, resetForm, rememberMe, location.state]);


  // ── Toggle mode (Login ↔ Register) ──
  const handleToggleMode = useCallback(() => {
    setIsLogin(prev => !prev);
    resetForm();
  }, [resetForm]);

  // ─── Destructure để dùng trong JSX dễ hơn ───
  const { identifier, email, password, confirmPassword, name, phone } = fields;

  return (
    <div className="login-page min-h-screen w-full flex bg-background relative overflow-hidden">

      {/* ── Nửa trái: Hình ảnh thương hiệu (ẩn trên mobile) ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative z-10 shrink-0"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
      >
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={isLogin ? 'img-login' : 'img-register'}
              src={isLogin
                ? 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80'
                : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80'}
              alt="FashionOS"
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
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
              key={isLogin ? 'txt-login' : 'txt-register'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-[3rem] font-black uppercase tracking-tighter leading-[0.9] mb-4">
                {isLogin ? 'Welcome\nBack.' : 'Join The\nMovement.'}
              </h2>
              <p className="text-white/70 font-medium text-sm leading-relaxed">
                {isLogin
                  ? 'Đăng nhập để khám phá các bộ sưu tập giới hạn và quản lý tài khoản của bạn.'
                  : 'Tạo tài khoản để nhận ưu đãi thành viên và trải nghiệm mua sắm cá nhân hóa.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Nửa phải: Form ── */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-16 xl:px-20 relative z-10 overflow-y-auto">
        <div className="absolute inset-0 z-0 lg:hidden opacity-10 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80" className="w-full h-full object-cover" alt="bg" />
        </div>

        <motion.div
          className="w-full mx-auto relative z-10 my-8"
          style={{ maxWidth: isLogin ? '400px' : '560px' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-card lg:bg-transparent p-5 sm:p-8 lg:p-0 rounded-2xl lg:rounded-none shadow-2xl lg:shadow-none border border-border/50 lg:border-none backdrop-blur-xl lg:backdrop-blur-none">

            {/* Logo mobile */}
            <Link to="/store" className="lg:hidden flex items-center justify-center gap-2 mb-7 w-max mx-auto">
              <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center font-black text-lg tracking-tighter rounded">FS</div>
              <span className="font-bold tracking-widest uppercase text-sm">FashionOS</span>
            </Link>

            {/* Header */}
            <div className="mb-7">
              <h3 className="text-2xl font-black tracking-tight mb-1">
                {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button onClick={handleToggleMode}
                  className="text-foreground font-bold hover:underline underline-offset-4 transition-all">
                  {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </div>

            {/* Thông báo */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg font-medium flex items-start gap-2 overflow-hidden">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div key="success"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 text-sm rounded-lg font-medium flex items-start gap-2 overflow-hidden">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? 'form-login' : 'form-register'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
              >
                {isLogin ? (
                  /* ── ĐĂNG NHẬP ── */
                  <div className="space-y-4">
                    <InputField icon={Mail} label="Email hoặc tên đăng nhập" required>
                      <input
                        type="text" required maxLength={150} autoComplete="username" autoFocus
                        value={identifier}
                        onChange={e => setField('identifier', e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Email hoặc tên đăng nhập"
                        autoComplete="username"
                      />
                    </InputField>

                    <InputField icon={Lock} label="Mật khẩu" required>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required value={password}
                          onChange={e => setField('password', e.target.value)}
                          className={`${INPUT_CLS} pr-10`}
                          placeholder="Nhập mật khẩu"
                          autoComplete="current-password"
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="peer appearance-none w-4 h-4 border-2 border-border rounded bg-transparent checked:bg-foreground checked:border-foreground transition-all cursor-pointer"
                            />
                            <CheckCircle2 className="absolute w-3 h-3 text-background opacity-0 peer-checked:opacity-100 pointer-events-none" />
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors select-none">
                            Nhớ mật khẩu
                          </span>
                        </label>
                        <a href="/reset-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold">Quên mật khẩu?</a>
                      </div>
                    </InputField>

                    <button type="submit" disabled={isLoading}
                      className="w-full py-3 mt-2 bg-foreground text-background text-xs font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-foreground/10 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isLoading
                        ? <Loader2 size={15} className="animate-spin" />
                        : <> Đăng nhập <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /> </>
                      }
                    </button>
                  </div>
                ) : (
                  /* ── ĐĂNG KÝ ── */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField icon={User} label="Họ và tên" required>
                        <input type="text" required minLength={2} maxLength={150} autoComplete="name" autoFocus value={name}
                          onChange={e => setField('name', e.target.value)}
                          className={INPUT_CLS} placeholder="Nguyễn Văn A"
                          autoComplete="name" />
                      </InputField>

                      <InputField icon={Phone} label="Số điện thoại" hint="Không bắt buộc">
                        <input type="tel" value={phone}
                          onChange={e => setField('phone', e.target.value)}
                          className={INPUT_CLS} placeholder="0912345678"
                          autoComplete="tel" />
                      </InputField>
                    </div>

                    <InputField icon={Mail} label="Email" required>
                      <input type="email" required maxLength={150} autoComplete="email" value={email}
                        onChange={e => setField('email', e.target.value)}
                        className={INPUT_CLS} placeholder="name@example.com"
                        autoComplete="email" />
                    </InputField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField icon={Lock} label="Mật khẩu" required hint="Tối thiểu 8 ký tự, tối đa 72 byte">
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} required minLength={8}
                            value={password} onChange={e => setField('password', e.target.value)}
                            className={`${INPUT_CLS} pr-10`} placeholder="••••••"
                            autoComplete="new-password" />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </InputField>

                      <InputField icon={Lock} label="Xác nhận mật khẩu" required>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required minLength={8}
                            value={confirmPassword}
                            onChange={e => setField('confirmPassword', e.target.value)}
                            className={`${INPUT_CLS} pr-10 ${
                              confirmPassword && confirmPassword !== password
                                ? 'border-red-500 focus:ring-red-500/20'
                                : confirmPassword && confirmPassword === password
                                  ? 'border-green-500 focus:ring-green-500/20'
                                  : ''
                            }`}
                            placeholder="••••••"
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        {confirmPassword && (
                          <p className={`text-xs mt-1 font-medium ${confirmPassword === password ? 'text-green-600' : 'text-red-500'}`}>
                            {confirmPassword === password ? '✓ Khớp' : '✗ Không khớp'}
                          </p>
                        )}
                      </InputField>
                    </div>

                    <button type="submit" disabled={isLoading}
                      className="w-full py-3 mt-2 bg-foreground text-background text-xs font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-foreground/10 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isLoading
                        ? <Loader2 size={15} className="animate-spin" />
                        : <> Tạo tài khoản <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" /> </>
                      }
                    </button>
                  </div>
                )}
              </motion.form>
            </AnimatePresence>



          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
