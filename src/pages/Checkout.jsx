import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import orderApi from '../api/orderApi';
import configApi from '../api/configApi';
import promotionApi from '../api/promotionApi';
import addressApi from '../api/addressApi';
import { CheckCircle2, Loader2, CreditCard, Banknote, Tag, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import VietmapAutocomplete from '../components/common/VietmapAutocomplete';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCartStore();
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    address: '',
    latitude: null,
    longitude: null,
    paymentMethod: 'cash',
    saveAddress: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('manual'); // 'manual' or address_id

  // Khuyến mãi state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { id, code, amount, minOrder }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState({ type: '', text: '' });

  const [config, setConfig] = useState({ fee: 30000, threshold: 500000 });

  React.useEffect(() => {
    configApi.getSettings().then(res => {
      if (res?.success) {
        setConfig({
          fee: Number(res.data.shipping_fee) || 30000,
          threshold: Number(res.data.free_shipping_threshold) || 500000
        });
      }
    }).catch(() => {});

    if (user && user.role === 'customer') {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.full_name || '',
        phone: prev.phone || user.phone || ''
      }));
      
      addressApi.get().then(res => {
        if (res?.success && res.data.length > 0) {
          setSavedAddresses(res.data);
          const defaultAddr = res.data.find(a => a.is_default) || res.data[0];
          setSelectedAddressId(defaultAddr.address_id);
          setFormData(prev => ({
            ...prev,
            fullName: defaultAddr.recipient_name,
            phone: defaultAddr.recipient_phone,
            address: `${defaultAddr.full_address}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.city}`,
            latitude: defaultAddr.latitude,
            longitude: defaultAddr.longitude
          }));
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    if (id === 'manual') {
      setFormData(prev => ({ ...prev, address: '', latitude: null, longitude: null, fullName: user?.full_name || '', phone: user?.phone || '' }));
    } else {
      const addr = savedAddresses.find(a => a.address_id === Number(id));
      if (addr) {
        setFormData(prev => ({
          ...prev,
          fullName: addr.recipient_name,
          phone: addr.recipient_phone,
          address: `${addr.full_address}, ${addr.ward}, ${addr.district}, ${addr.city}`,
          latitude: addr.latitude,
          longitude: addr.longitude
        }));
      }
    }
  };

  const shippingFee = totalPrice >= config.threshold ? 0 : config.fee;
  const discount = appliedPromo ? appliedPromo.amount : 0;
  const finalTotal = Math.max(0, totalPrice + shippingFee - discount);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  // Nếu giá trị đơn thay đổi, kiểm tra lại mã giảm giá
  useEffect(() => {
    if (appliedPromo && totalPrice < appliedPromo.minOrder) {
      setAppliedPromo(null);
      setPromoMsg({ type: 'error', text: 'Mã giảm giá đã bị hủy do tổng tiền không đủ điều kiện' });
    }
  }, [totalPrice, appliedPromo]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      return setPromoMsg({ type: 'error', text: 'Vui lòng nhập mã' });
    }
    setPromoLoading(true);
    setPromoMsg({ type: '', text: '' });
    try {
      const res = await promotionApi.apply(promoCode.trim(), totalPrice, 'online');
      if (res && res.success && res.data) {
        setAppliedPromo({
          id: res.data.promotion_id,
          code: res.data.promo_code,
          amount: res.data.discount_amount,
          minOrder: res.data.min_order_amount || 0
        });
        setPromoMsg({ type: 'success', text: 'Áp dụng mã thành công' });
        setPromoCode('');
      } else {
        setPromoMsg({ type: 'error', text: res?.message || 'Lỗi áp dụng mã' });
      }
    } catch (error) {
      setPromoMsg({ type: 'error', text: error.response?.data?.message || 'Mã giảm giá không hợp lệ' });
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoMsg({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Giỏ hàng trống');
      return setError('Giỏ hàng trống');
    }
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return setError('Vui lòng điền đầy đủ thông tin giao hàng');
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        customer: {
          fullName: formData.fullName,
          phone: formData.phone
        },
        shipping_address: formData.address,
        shipping_latitude: formData.latitude,
        shipping_longitude: formData.longitude,
        payment_method: formData.paymentMethod,
        items: items.map(i => ({
          variant_id: i.id,
          quantity: i.qty
        })),
        discount_amount: discount,
        promotion_id: appliedPromo ? appliedPromo.id : null
      };

      const res = await orderApi.create(payload);
      if (res && res.success) {
        if (user && user.role === 'customer' && selectedAddressId === 'manual' && formData.saveAddress) {
          try {
            await addressApi.add({
              recipient_name: formData.fullName,
              recipient_phone: formData.phone,
              full_address: formData.address,
              ward: '', district: '', city: '',
              latitude: formData.latitude,
              longitude: formData.longitude,
              is_default: savedAddresses.length === 0
            });
          } catch (e) {
            console.error('Lỗi tự động lưu địa chỉ mới:', e);
          }
        }
        
        clearCart();
        if (res.data?.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        } else {
          setSuccess(true);
          toast.success('Đặt hàng thành công!');
        }
      } else {
        setError(res?.message || 'Có lỗi xảy ra khi đặt hàng');
        toast.error(res?.message || 'Có lỗi xảy ra khi đặt hàng');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối');
      toast.error(err.response?.data?.message || err.message || 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl text-center border border-border">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Đặt hàng thành công!</h1>
          <p className="text-muted-foreground mb-8">
            Cảm ơn bạn đã mua sắm tại FashionOS. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao.
          </p>
          <button 
            onClick={() => navigate('/store')}
            className="w-full bg-foreground text-background py-4 font-bold uppercase tracking-widest hover:bg-foreground/90 transition-colors"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-2xl text-center border border-border">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-4">Bạn chưa đăng nhập</h1>
          <p className="text-muted-foreground mb-8">
            Vui lòng đăng nhập tài khoản để có thể đặt hàng trực tuyến.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/store')}
              className="flex-1 border border-foreground text-foreground py-3 font-bold uppercase tracking-widest hover:bg-muted transition-colors"
            >
              Quay lại
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="flex-1 bg-foreground text-background py-3 font-bold uppercase tracking-widest hover:bg-foreground/90 transition-colors"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Thanh toán</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-20 bg-muted rounded-xl">
            <p className="text-muted-foreground mb-4">Giỏ hàng của bạn đang trống</p>
            <button onClick={() => navigate('/store')} className="text-primary underline font-medium">Quay lại cửa hàng</button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Thông tin giao hàng */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold uppercase tracking-wider border-b border-border pb-2">Thông tin giao hàng</h2>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg">
                      {error}
                    </div>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground block mb-2">Chọn địa chỉ đã lưu</label>
                      <select 
                        value={selectedAddressId} 
                        onChange={(e) => handleAddressSelect(e.target.value)}
                        className="w-full px-4 py-3 bg-muted border border-border outline-none focus:border-foreground transition-colors font-medium text-sm"
                      >
                        {savedAddresses.map(addr => (
                          <option key={addr.address_id} value={addr.address_id}>
                            {addr.recipient_name} - {addr.full_address}, {addr.ward}, {addr.district}, {addr.city}
                          </option>
                        ))}
                        <option value="manual">+ Nhập địa chỉ mới</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Họ và tên *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} disabled={selectedAddressId !== 'manual'} required
                        className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors disabled:bg-muted" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Số điện thoại *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={selectedAddressId !== 'manual'} required
                        className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors disabled:bg-muted" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Địa chỉ nhận hàng chi tiết *</label>
                    <div className={selectedAddressId !== 'manual' ? 'opacity-50 pointer-events-none' : ''}>
                      <VietmapAutocomplete 
                        value={formData.address}
                        onChange={(val, lat, lng) => setFormData(p => ({ ...p, address: val, latitude: lat || p.latitude, longitude: lng || p.longitude }))}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      />
                    </div>
                  </div>
                  {user && user.role === 'customer' && selectedAddressId === 'manual' && (
                    <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <input type="checkbox" checked={formData.saveAddress} onChange={e => setFormData(p => ({...p, saveAddress: e.target.checked}))} className="w-4 h-4 accent-foreground" />
                      Lưu thông tin giao hàng này cho những lần đặt hàng sau
                    </label>
                  )}
                </div>

                {/* Phương thức thanh toán */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold uppercase tracking-wider border-b border-border pb-2">Phương thức thanh toán</h2>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'cash' ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/50'}`}>
                      <input type="radio" name="paymentMethod" value="cash" checked={formData.paymentMethod === 'cash'} onChange={handleChange} className="w-4 h-4 accent-foreground" />
                      <Banknote className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-bold">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-xs text-muted-foreground">Thanh toán bằng tiền mặt khi giao hàng.</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'stripe' ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/50'}`}>
                      <input type="radio" name="paymentMethod" value="stripe" checked={formData.paymentMethod === 'stripe'} onChange={handleChange} className="w-4 h-4 accent-foreground" />
                      <CreditCard className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-bold">Thanh toán qua Stripe</p>
                        <p className="text-xs text-muted-foreground">Hỗ trợ thẻ Visa, MasterCard, Amex quốc tế.</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'vnpay' ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/50'}`}>
                      <input type="radio" name="paymentMethod" value="vnpay" checked={formData.paymentMethod === 'vnpay'} onChange={handleChange} className="w-4 h-4 accent-foreground" disabled />
                      <div className="flex-1 opacity-50">
                        <p className="font-bold">Thanh toán qua VNPay (Đang bảo trì)</p>
                        <p className="text-xs text-muted-foreground">Hỗ trợ thẻ ATM nội địa.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || formData.paymentMethod === 'vnpay'}
                  className="w-full bg-foreground text-background py-5 font-black uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đặt hàng'}
                </button>
              </form>
            </div>

            {/* Tổng kết đơn hàng */}
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="bg-muted p-6 border border-border sticky top-24">
                <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Tóm tắt đơn hàng</h2>
                
                <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-20 bg-background border border-border shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-bold line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? ` | ${item.color}` : ''}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-medium">SL: {item.qty}</span>
                          <span className="font-bold">{(Number(item.price) * item.qty).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mã giảm giá */}
                <div className="mb-6 border-t border-border pt-6">
                  {!appliedPromo ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã giảm giá..." 
                          className="flex-1 bg-background border border-border px-4 py-2 outline-none focus:border-foreground text-sm uppercase font-bold"
                        />
                        <button 
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="bg-foreground text-background px-4 font-bold text-sm disabled:opacity-50 hover:bg-foreground/90 transition-colors flex items-center justify-center min-w-[80px]"
                        >
                          {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}
                        </button>
                      </div>
                      {promoMsg.text && (
                        <p className={`text-xs font-bold ${promoMsg.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {promoMsg.text}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-600">Mã: {appliedPromo.code}</p>
                          <p className="text-[10px] text-emerald-600/80">Đã áp dụng thành công</p>
                        </div>
                      </div>
                      <button type="button" onClick={removePromo} className="p-1 hover:bg-emerald-500/20 rounded text-emerald-600">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6 border-t border-border/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-bold">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="font-bold">{shippingFee.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-600">
                      <span className="font-medium">Giảm giá ({appliedPromo.code})</span>
                      <span className="font-bold">-{appliedPromo.amount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-6 border-t border-border">
                  <span className="font-bold uppercase tracking-wider">Tổng cộng</span>
                  <span className="text-2xl font-black">
                    {Math.max(0, totalPrice + shippingFee - (appliedPromo ? appliedPromo.amount : 0)).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
