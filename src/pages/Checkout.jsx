import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import orderApi from '../api/orderApi';
import { CheckCircle2, Loader2, CreditCard, Wallet, Banknote } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    address: '',
    paymentMethod: 'cash'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const shippingFee = 30000;
  const finalTotal = totalPrice + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('Giỏ hàng trống');
    if (!formData.fullName || !formData.phone || !formData.address) {
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
        payment_method: formData.paymentMethod,
        items: items.map(i => ({
          variant_id: i.id, // ID trong giỏ hàng chính là variant_id
          quantity: i.qty
        }))
      };

      const res = await orderApi.create(payload);
      if (res && res.success) {
        clearCart();
        setSuccess(true);
      } else {
        setError(res?.message || 'Có lỗi xảy ra khi đặt hàng');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối');
    }
    setIsLoading(false);
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Họ và tên *</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Số điện thoại *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                        className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Địa chỉ nhận hàng chi tiết *</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} required rows={3}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full px-4 py-3 bg-background border border-border outline-none focus:border-foreground transition-colors resize-none" />
                  </div>
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

                    <label className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${formData.paymentMethod === 'vnpay' ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/50'}`}>
                      <input type="radio" name="paymentMethod" value="vnpay" checked={formData.paymentMethod === 'vnpay'} onChange={handleChange} className="w-4 h-4 accent-foreground" />
                      <CreditCard className="text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-bold">Thanh toán qua VNPay (Sắp ra mắt)</p>
                        <p className="text-xs text-muted-foreground">Hỗ trợ thẻ ATM, Visa, MasterCard.</p>
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
                
                <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto scrollbar-thin">
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
                          <span className="font-bold">{(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-6 border-t border-border">
                  <span className="font-bold uppercase tracking-wider">Tổng cộng</span>
                  <span className="text-2xl font-black">{finalTotal.toLocaleString('vi-VN')}đ</span>
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
