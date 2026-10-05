import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const StaffProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/accounts/me');
      if (res?.success) {
        setProfile(res.data);
        setProfileForm({ 
          full_name: res.data.full_name || '', 
          phone: res.data.phone || '' 
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim() || profileForm.full_name.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Họ và tên phải có ít nhất 2 ký tự' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await axiosClient.put('/accounts/me', {
        full_name: profileForm.full_name,
        phone: profileForm.phone
      });
      if (res?.success) {
        setProfile(prev => ({ ...prev, ...profileForm }));
        setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      } else {
        setProfileMsg({ type: 'error', text: res?.message || 'Lỗi' });
      }
    } catch (err) {
      setProfileMsg({ type: 'error', text: err?.message || 'Lỗi kết nối' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (passForm.newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setPassSaving(true);
    try {
      const res = await axiosClient.put('/accounts/me', {
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        password: passForm.newPassword
      });
      if (res?.success) {
        setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPassForm({ newPassword: '', confirmPassword: '' });
      } else {
        setPassMsg({ type: 'error', text: res?.message || 'Lỗi' });
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err?.message || 'Lỗi kết nối' });
    } finally {
      setPassSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const INPUT_CLS = "w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary transition-colors text-sm";
  const DISABLED_CLS = "w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground cursor-not-allowed opacity-70";

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground mt-1 text-sm">Quản lý thông tin tài khoản nội bộ của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <User size={18} />
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'password' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Lock size={18} />
            Đổi mật khẩu
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  
                  {/* Avatar & Role Info */}
                  <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-black shadow-lg">
                      {profile?.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{profile?.full_name || 'Chưa cập nhật'}</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold uppercase px-2.5 py-1 bg-primary/10 text-primary rounded-md">
                          {profile?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                        </span>
                        {profile?.branch_name && (
                          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-md flex items-center gap-1">
                            <MapPin size={12} /> {profile.branch_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {profileMsg.text && (
                    <div className={`p-4 mb-6 text-sm rounded-xl border flex items-center gap-3 ${
                      profileMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-red-500/10 border-red-500/20 text-red-700'
                    }`}>
                      {profileMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      {profileMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">Họ và tên *</label>
                        <input type="text" value={profileForm.full_name} onChange={e => setProfileForm(p => ({...p, full_name: e.target.value}))} required className={INPUT_CLS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">Email</label>
                        <input type="email" value={profile?.email || ''} disabled className={DISABLED_CLS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">Số điện thoại</label>
                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} className={INPUT_CLS} />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={profileSaving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {profileSaving && <Loader2 size={16} className="animate-spin" />}
                        Lưu thông tin
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                  <h2 className="text-lg font-bold mb-6 pb-4 border-b border-border">Đổi mật khẩu bảo mật</h2>

                  {passMsg.text && (
                    <div className={`p-4 mb-6 text-sm rounded-xl border flex items-center gap-3 ${
                      passMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-red-500/10 border-red-500/20 text-red-700'
                    }`}>
                      {passMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      {passMsg.text}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">Mật khẩu mới *</label>
                      <input
                        type="password"
                        value={passForm.newPassword}
                        onChange={e => setPassForm(p => ({...p, newPassword: e.target.value}))}
                        required minLength={6}
                        className={INPUT_CLS}
                        placeholder="Nhập ít nhất 6 ký tự"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block ml-1">Xác nhận mật khẩu *</label>
                      <input
                        type="password"
                        value={passForm.confirmPassword}
                        onChange={e => setPassForm(p => ({...p, confirmPassword: e.target.value}))}
                        required
                        className={INPUT_CLS}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                    </div>
                    <div className="pt-2">
                      <button type="submit" disabled={passSaving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {passSaving && <Loader2 size={16} className="animate-spin" />}
                        Đổi mật khẩu
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
