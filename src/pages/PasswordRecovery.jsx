import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Check, Loader2, LockKeyhole } from 'lucide-react';
import OtpInput from '../components/shared/OtpInput';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function PasswordRecovery() {
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const otpInput = useRef(null);
  const seconds = challenge ? Math.max(0, Math.ceil((challenge.deadline - now) / 1000)) : 0;
  useEffect(() => {
    if (!challenge || done || resetToken) return;
    otpInput.current?.focus();
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [challenge, done, resetToken]);

  const sendOtp = async event => {
    event?.preventDefault();
    if (busy.current || (challenge && seconds > 0)) return;
    busy.current = true; setLoading(true); setError(''); setMessage('');
    try {
      const startedAt = Date.now();
      const result = await axiosClient.post('/auth/forgot-password', { email: email.trim() });
      // Count from request start, including time spent sending mail; server enforces expiry.
      setChallenge({ id: result.data.request_id, deadline: startedAt + 60000 });
      setNow(Date.now()); setOtp(''); setMessage(result.message);
    } catch (err) { setError(err.message || 'Không gửi được yêu cầu. Vui lòng thử lại.'); }
    finally { busy.current = false; setLoading(false); }
  };

  const verifyOtp = async code => {
    if (busy.current || !challenge || Date.now() >= challenge.deadline || resetToken) return;
    if (!/^\d{6}$/.test(code)) { setError('Nh\u1eadp \u0111\u1ee7 6 ch\u1eef s\u1ed1 OTP'); return; }
    busy.current = true; setLoading(true); setError(''); setMessage('');
    try {
      const result = await axiosClient.post('/auth/verify-password-otp', { request_id: challenge.id, otp: code });
      setResetToken(result.data.reset_token); setOtp(''); setMessage(result.message);
    } catch (err) { setOtp(''); setError(err.message || 'OTP kh\u00f4ng h\u1ee3p l\u1ec7'); }
    finally { busy.current = false; setLoading(false); requestAnimationFrame(() => otpInput.current?.focus()); }
  };

  const submit = async event => {
    event.preventDefault();
    if (busy.current || !resetToken || done) return;
    setError(''); setMessage('');
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) { setError('Mật khẩu cần từ 8 ký tự, tối đa 72 byte'); return; }
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    busy.current = true; setLoading(true);
    try {
      const result = await axiosClient.post('/auth/reset-password', { reset_token: resetToken, password });
      setDone(true); setResetToken(''); setMessage(result.message); setPassword(''); setConfirm(''); setOtp('');
    } catch (err) { setError(err.message || 'Không đổi được mật khẩu'); }
    finally { busy.current = false; setLoading(false); }
  };
  const inputClass = 'recovery-input block w-full mt-2 border border-border bg-background rounded-xl p-3.5';
  return <main className="recovery-page min-h-dvh flex flex-col items-center justify-center px-4 py-8 text-foreground">
    <Link to="/store" className="mb-8 flex items-center gap-2.5 font-bold tracking-tight text-xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-foreground text-background text-sm font-black">FS</span>FashionOS</Link>
    <div className="recovery-shell w-full max-w-4xl grid lg:grid-cols-[.85fr_1.15fr] rounded-3xl overflow-hidden border border-border shadow-xl">
      <aside className="recovery-aside hidden lg:flex flex-col justify-between p-9 text-white"><span className="text-xs tracking-[.22em] uppercase text-white/60">FashionOS · Tài khoản</span><div><ShieldCheck size={40} strokeWidth={1.4} className="mb-6 text-amber-200" /><h2 className="text-4xl font-semibold tracking-tight leading-tight">Trở lại với<br />phong cách của bạn.</h2><p className="text-sm text-white/65 mt-5 leading-7">Xác thực email và tạo mật khẩu mới để tiếp tục khám phá những lựa chọn yêu thích.</p></div><p className="text-xs text-white/50 mt-12">OTP dùng một lần · Hiệu lực 60 giây</p></aside>
      <section className="bg-card p-6 sm:p-10 space-y-5 min-w-0">
      <div className="flex items-center justify-between"><span className="recovery-icon">{done ? <Check size={24} /> : challenge ? <ShieldCheck size={24} /> : <LockKeyhole size={24} />}</span><span className="text-xs font-medium text-muted-foreground">{done ? 'Hoàn tất' : resetToken ? 'B\u01b0\u1edbc 3 / 3' : challenge ? 'B\u01b0\u1edbc 2 / 3' : 'B\u01b0\u1edbc 1 / 3'}</span></div>
    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{done ? 'Đã đổi mật khẩu' : resetToken ? 'T\u1ea1o m\u1eadt kh\u1ea9u m\u1edbi' : challenge ? 'X\u00e1c th\u1ef1c OTP' : 'Quên mật khẩu'}</h1>
    {!done && <p className="text-sm text-muted-foreground">{resetToken ? 'Email \u0111\u00e3 \u0111\u01b0\u1ee3c x\u00e1c th\u1ef1c. H\u00e3y t\u1ea1o m\u1eadt kh\u1ea9u m\u1edbi trong 5 ph\u00fat.' : challenge ? <>Mã gồm 6 chữ số được gửi đến <strong className="break-all">{email}</strong>. Có hiệu lực trong 1 phút và chỉ dùng một lần.</> : 'Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.'}</p>}
    {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-destructive text-sm leading-relaxed">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-emerald-700 dark:text-emerald-400 text-sm leading-relaxed">{message}</p>}
    {!done && (!challenge ? <form onSubmit={sendOtp} className="space-y-4">
      <label className="block text-sm">Email<input className={inputClass} type="email" autoComplete="email" required maxLength={150} disabled={loading} value={email} onChange={e => setEmail(e.target.value)} /></label>
      <button disabled={loading} className="recovery-submit w-full rounded-xl p-3.5 bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}{loading ? 'Đang gửi...' : 'Gửi mã OTP'}</button>
    </form> : !resetToken ? <>
      <p className={`text-sm font-semibold ${seconds ? '' : 'text-destructive'}`}>{seconds ? `Mã còn hiệu lực ${seconds} giây` : 'Mã đã hết hạn. Hãy gửi lại OTP.'}</p>
      <form onSubmit={event => event.preventDefault()} className="space-y-4" aria-busy={loading}>
        <OtpInput inputRef={otpInput} value={otp} onChange={code => { if (busy.current) return; setOtp(code); setError(''); if (/^\d{6}$/.test(code) && code !== otp) void verifyOtp(code); }} disabled={loading || !seconds} invalid={Boolean(error)} />
        <p role="status" className="text-sm text-muted-foreground flex items-center gap-2">{loading ? <><Loader2 size={16} className="animate-spin" />{'\u0110ang x\u00e1c th\u1ef1c OTP...'}</> : 'Nh\u1eadp \u0111\u1ee7 6 s\u1ed1 \u0111\u1ec3 t\u1ef1 \u0111\u1ed9ng x\u00e1c th\u1ef1c.'}</p>
      </form>
      <div className="flex flex-wrap gap-3 text-sm"><button type="button" disabled={loading || seconds > 0} onClick={sendOtp} className="underline p-2 disabled:opacity-50">Gửi lại OTP{seconds > 0 ? ` (${seconds}s)` : ''}</button><button type="button" disabled={loading} onClick={() => { setChallenge(null); setResetToken(''); setOtp(''); setError(''); setMessage(''); setPassword(''); setConfirm(''); }} className="underline p-2 disabled:opacity-50">Đổi email</button></div>
    </> : <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Mật khẩu mới<input className={inputClass} type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={loading} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label className="block text-sm">Xác nhận mật khẩu<input className={inputClass} type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={loading} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        <p className="text-xs text-muted-foreground">Từ 8 ký tự, tối đa 72 byte. Sau khi đổi, các phiên đăng nhập cũ sẽ hết hiệu lực.</p>
        <button disabled={loading} className="recovery-submit w-full rounded-xl p-3.5 bg-primary text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}{loading ? 'Đang xử lý...' : 'Xác nhận và đổi mật khẩu'}</button>
      <button type="button" disabled={loading} onClick={() => { setResetToken(''); setChallenge(null); setOtp(''); setPassword(''); setConfirm(''); setError(''); setMessage(''); }} className="text-sm underline underline-offset-4 text-muted-foreground py-2 disabled:opacity-50">Yêu cầu mã mới</button>
    </form>)}
    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-2"><ArrowLeft size={16} />Quay lại đăng nhập</Link>
  </section></div></main>;
}
