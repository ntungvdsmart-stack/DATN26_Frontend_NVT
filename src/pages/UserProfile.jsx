import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Lock, ChevronRight, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, Clock, Truck, XCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import userApi from '../api/userApi';
import addressApi from '../api/addressApi';
import wishlistApi from '../api/wishlistApi';
import VietmapAutocomplete from '../components/common/VietmapAutocomplete';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle2 },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Package },
  shipping: { label: 'Đang giao', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Truck },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  returned: { label: 'Trả hàng', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: RotateCcw },
};

const UserProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ recipient_name: '', recipient_phone: '', full_address: '', ward: '', district: '', city: '', is_default: false, latitude: null, longitude: null });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [passSaving, setPassSaving] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchOrders();
    fetchAddresses();
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      const res = await wishlistApi.get();
      if (res && res.success) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setWishlistLoading(false);
  };

  const fetchAddresses = async () => {
    try {
      const res = await addressApi.get();
      if (res?.success) setAddresses(res.data);
    } catch (err) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await userApi.getProfile();
      if (res?.success) {
        setProfile(res.data);
        setProfileForm({ full_name: res.data.full_name || user?.full_name || '', phone: res.data.phone || user?.phone || '' });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await userApi.getMyOrders();
      if (res?.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const handleViewOrderDetail = async (orderId) => {
    if (selectedOrder?.order_id === orderId) {
      setSelectedOrder(null);
      return;
    }
    setOrderDetailLoading(true);
    try {
      const res = await userApi.getMyOrderDetail(orderId);
      if (res?.success) {
        setSelectedOrder(res.data);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    }
    setOrderDetailLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim() || profileForm.full_name.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Họ và tên phải có ít nhất 2 ký tự' });
      return;
    }
    if (profileForm.phone && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(profileForm.phone)) {
      setProfileMsg({ type: 'error', text: 'Số điện thoại không hợp lệ' });
      return;
    }
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await userApi.updateProfile(profileForm);
      if (res?.success) {
        setProfile(res.data);
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
    if (passForm.newPassword === passForm.currentPassword) {
      setPassMsg({ type: 'error', text: 'Mật khẩu mới không được trùng mật khẩu hiện tại' });
      return;
    }
    setPassSaving(true);
    try {
      const res = await userApi.changePassword({
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      if (res?.success) {
        setPassMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPassMsg({ type: 'error', text: res?.message || 'Lỗi' });
      }
    } catch (err) {
      setPassMsg({ type: 'error', text: err?.message || 'Lỗi kết nối' });
    } finally {
      setPassSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Thông tin cá nhân' },
    { id: 'orders', icon: Package, label: 'Lịch sử đơn hàng' },
    { id: 'wishlist', icon: Heart, label: 'Sản phẩm yêu thích' },
    { id: 'addresses', icon: Truck, label: 'Sổ địa chỉ' },
    { id: 'password', icon: Lock, label: 'Đổi mật khẩu' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const INPUT_CLS = "w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors text-sm";

  return (
    <div className="bg-background min-h-screen pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Tài khoản của tôi</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Xin chào, <span className="font-bold text-foreground">{profile?.full_name || user?.full_name}</span>
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-card border border-border p-5 text-center">
            <p className="text-2xl font-black">{profile?.total_orders || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Đơn hàng</p>
          </div>
          <div className="bg-card border border-border p-5 text-center">
            <p className="text-2xl font-black">{Number(profile?.total_spent || 0).toLocaleString('vi-VN')}đ</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Đã chi tiêu</p>
          </div>
          <div className="bg-card border border-border p-5 text-center">
            <p className="text-2xl font-black capitalize">{profile?.customer_type || 'online'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Loại tài khoản</p>
          </div>
          <div className="bg-card border border-border p-5 text-center">
            <p className="text-2xl font-black">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : '—'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Tham gia từ</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-56 shrink-0">
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto scrollbar-none pb-2 lg:pb-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap',
                      isActive ? 'bg-foreground text-background shadow-sm' : 'hover:bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/5 transition-all whitespace-nowrap mt-2 lg:mt-4"
              >
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* ── TAB: Thông tin cá nhân ── */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="bg-card border border-border p-6 md:p-8">
                    <h2 className="text-lg font-bold uppercase tracking-wider mb-6 border-b border-border pb-3">Thông tin cá nhân</h2>

                    {profileMsg.text && (
                      <div className={`p-3 mb-6 text-sm rounded-lg border flex items-center gap-2 ${
                        profileMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                      }`}>
                        {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {profileMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Họ và tên *</label>
                        <input type="text" value={profileForm.full_name} onChange={e => setProfileForm(p => ({...p, full_name: e.target.value}))} required className={INPUT_CLS} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                        <input type="email" value={profile?.email || user?.email || ''} disabled className={`${INPUT_CLS} opacity-50 cursor-not-allowed`} />
                        <p className="text-[10px] text-muted-foreground">Email không thể thay đổi</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Số điện thoại</label>
                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))} className={INPUT_CLS} />
                      </div>
                      <button type="submit" disabled={profileSaving} className="bg-foreground text-background px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {profileSaving && <Loader2 size={14} className="animate-spin" />}
                        Lưu thay đổi
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Lịch sử đơn hàng ── */}
              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="bg-card border border-border p-6 md:p-8">
                    <h2 className="text-lg font-bold uppercase tracking-wider mb-6 border-b border-border pb-3">Lịch sử đơn hàng</h2>

                    {orders.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Bạn chưa có đơn hàng nào</p>
                        <button onClick={() => navigate('/store')} className="mt-4 text-primary underline underline-offset-4 text-sm font-medium">Bắt đầu mua sắm</button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => {
                          const status = statusConfig[order.order_status] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          const isExpanded = selectedOrder?.order_id === order.order_id;
                          
                          return (
                            <div key={order.order_id} className="border border-border overflow-hidden">
                              <button
                                onClick={() => handleViewOrderDetail(order.order_id)}
                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-muted/50 transition-colors text-left gap-3"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-sm">
                                    <p className="font-bold">{order.order_code}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      {' · '}{order.total_items} sản phẩm
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 border ${status.color} flex items-center gap-1.5`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                  </span>
                                  <span className="font-bold text-sm min-w-[100px] text-right">{Number(order.total_amount).toLocaleString('vi-VN')}đ</span>
                                  <ChevronRight size={16} className={cn('text-muted-foreground transition-transform', isExpanded && 'rotate-90')} />
                                </div>
                              </button>

                              {/* Order detail expand */}
                              <AnimatePresence>
                                {isExpanded && selectedOrder && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="border-t border-border p-4 md:p-5 bg-muted/30">
                                      {orderDetailLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                          <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                      ) : (
                                        <>
                                          <p className="text-xs text-muted-foreground mb-3">
                                            <span className="font-bold">Địa chỉ:</span> {selectedOrder.shipping_address_snapshot}
                                          </p>
                                          <div className="space-y-3">
                                            {selectedOrder.items?.map(item => (
                                              <div key={item.order_item_id} className="flex items-center gap-4 bg-background p-3 border border-border">
                                                <div className="w-14 h-14 bg-muted shrink-0 overflow-hidden">
                                                  {item.image_url ? (
                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                  ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">N/A</div>
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-bold text-sm truncate">{item.product_name}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {item.color_name && `${item.color_name}`}{item.size_value && ` · ${item.size_value}`} · SL: {item.quantity}
                                                  </p>
                                                </div>
                                                <p className="font-bold text-sm shrink-0">{Number(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                                            <span className="text-muted-foreground">Phương thức thanh toán</span>
                                            <span className="font-bold uppercase">{selectedOrder.payment_method || 'COD'}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Sổ địa chỉ ── */}
              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="bg-card border border-border p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
                      <h2 className="text-lg font-bold uppercase tracking-wider">Sổ địa chỉ</h2>
                      <button 
                        onClick={() => {
                          setIsAddingAddress(!isAddingAddress);
                          if (!isAddingAddress) {
                            setAddressForm({ 
                              recipient_name: profile?.full_name || user?.full_name || '', 
                              recipient_phone: profile?.phone || user?.phone || '', 
                              full_address: '', ward: '', district: '', city: '', is_default: false, latitude: null, longitude: null 
                            });
                          }
                        }}
                        className="text-xs font-bold uppercase tracking-widest bg-foreground text-background px-4 py-2 hover:bg-foreground/90 transition-colors"
                      >
                        {isAddingAddress ? 'Hủy' : '+ Thêm địa chỉ mới'}
                      </button>
                    </div>

                    {isAddingAddress && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await addressApi.add(addressForm);
                          setIsAddingAddress(false);
                          setAddressForm({ recipient_name: '', recipient_phone: '', full_address: '', ward: '', district: '', city: '', is_default: false, latitude: null, longitude: null });
                          fetchAddresses();
                        } catch (err) {
                          alert('Lỗi thêm địa chỉ');
                        }
                      }} className="mb-8 p-4 border border-border bg-muted/20 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Họ tên người nhận *</label>
                            <input type="text" required value={addressForm.recipient_name} onChange={e => setAddressForm(p => ({...p, recipient_name: e.target.value}))} className={INPUT_CLS} />
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Số điện thoại *</label>
                            <input type="text" required value={addressForm.recipient_phone} onChange={e => setAddressForm(p => ({...p, recipient_phone: e.target.value}))} className={INPUT_CLS} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Địa chỉ đầy đủ *</label>
                          <VietmapAutocomplete 
                            value={addressForm.full_address}
                            onChange={(val, lat, lng) => setAddressForm(p => ({...p, full_address: val, city: '', district: '', ward: '', latitude: lat || p.latitude, longitude: lng || p.longitude}))}
                            placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                            className="bg-muted/50 border-border focus:bg-background"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-medium">
                          <input type="checkbox" checked={addressForm.is_default} onChange={e => setAddressForm(p => ({...p, is_default: e.target.checked}))} className="w-4 h-4 accent-primary" />
                          Đặt làm địa chỉ mặc định
                        </label>
                        <button type="submit" className="bg-primary text-primary-foreground px-6 py-2.5 font-bold uppercase tracking-widest hover:opacity-90 w-full mt-2">Lưu Địa Chỉ</button>
                      </form>
                    )}

                    <div className="space-y-4">
                      {addresses.length === 0 && !isAddingAddress && (
                        <p className="text-center text-muted-foreground py-8">Bạn chưa có địa chỉ nào được lưu.</p>
                      )}
                      {addresses.map(addr => (
                        <div key={addr.address_id} className="border border-border p-4 flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-lg">{addr.recipient_name}</span>
                              {addr.is_default === 1 && <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-sm border border-emerald-500/20">Mặc định</span>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">SĐT: {addr.recipient_phone}</p>
                            <p className="text-sm">{addr.full_address}</p>
                            <p className="text-sm">{addr.ward}, {addr.district}, {addr.city}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {!addr.is_default && (
                              <button onClick={async () => { await addressApi.setDefault(addr.address_id); fetchAddresses(); }} className="text-xs font-bold text-primary hover:underline">Đặt mặc định</button>
                            )}
                            <button onClick={async () => { if(confirm('Xóa địa chỉ?')){ await addressApi.remove(addr.address_id); fetchAddresses(); } }} className="text-xs font-bold text-destructive hover:underline">Xóa</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── TAB: Đổi mật khẩu ── */}
              {activeTab === 'password' && (
                <motion.div key="password" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="bg-card border border-border p-6 md:p-8">
                    <h2 className="text-lg font-bold uppercase tracking-wider mb-6 border-b border-border pb-3">Đổi mật khẩu</h2>

                    {passMsg.text && (
                      <div className={`p-3 mb-6 text-sm rounded-lg border flex items-center gap-2 ${
                        passMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
                      }`}>
                        {passMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {passMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mật khẩu hiện tại *</label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={passForm.currentPassword}
                            onChange={e => setPassForm(p => ({...p, currentPassword: e.target.value}))}
                            required
                            className={INPUT_CLS}
                          />
                          <button type="button" onClick={() => setShowCurrentPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mật khẩu mới * (tối thiểu 6 ký tự)</label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={passForm.newPassword}
                            onChange={e => setPassForm(p => ({...p, newPassword: e.target.value}))}
                            required
                            minLength={6}
                            className={INPUT_CLS}
                          />
                          <button type="button" onClick={() => setShowNewPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Xác nhận mật khẩu mới *</label>
                        <input
                          type="password"
                          value={passForm.confirmPassword}
                          onChange={e => setPassForm(p => ({...p, confirmPassword: e.target.value}))}
                          required
                          className={INPUT_CLS}
                        />
                      </div>
                      <button type="submit" disabled={passSaving} className="bg-foreground text-background px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                        {passSaving && <Loader2 size={14} className="animate-spin" />}
                        Đổi mật khẩu
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border p-6 md:p-10 min-h-[500px]"
                >
                  <h2 className="text-2xl font-black uppercase mb-8 pb-4 border-b border-border">Sản phẩm yêu thích</h2>
                  {wishlistLoading ? (
                      <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
                  ) : wishlist.length === 0 ? (
                      <div className="text-center py-20">
                          <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">Bạn chưa có sản phẩm yêu thích nào.</p>
                          <button onClick={() => navigate('/store/products')} className="mt-6 px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors">
                              Khám phá ngay
                          </button>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {wishlist.map(item => (
                              <div key={item.wishlist_id} className="group relative border border-border bg-background flex flex-col">
                                  <Link to={`/store/product/${item.product_id}`} className="block relative aspect-[3/4] bg-muted/30 overflow-hidden">
                                      <img src={item.image_url || '/placeholder.jpg'} alt={item.product_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  </Link>
                                  <div className="p-4 flex flex-col flex-1">
                                      <h3 className="font-bold text-sm line-clamp-2 uppercase group-hover:text-primary transition-colors">
                                          <Link to={`/store/product/${item.product_id}`}>{item.product_name}</Link>
                                      </h3>
                                      <p className="text-xs text-muted-foreground mt-1">{item.color_name} · {item.size_name}</p>
                                      <p className="font-black mt-2">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                                      
                                      <button 
                                          onClick={async (e) => {
                                              e.preventDefault();
                                              await wishlistApi.toggle(item.variant_id);
                                              fetchWishlist();
                                          }}
                                          className="mt-4 py-2 border border-border text-xs font-bold uppercase hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-center w-full"
                                      >
                                          Bỏ yêu thích
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
