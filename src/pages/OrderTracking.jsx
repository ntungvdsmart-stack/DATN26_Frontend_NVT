import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Package, Truck, CheckCircle2, RotateCcw, AlertCircle, XCircle } from 'lucide-react';
import orderApi from '../api/orderApi';
import returnApi from '../api/returnApi';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const OrderTracking = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const codeParam = searchParams.get('code');
  const paymentParam = searchParams.get('payment');
  
  const [orderCode, setOrderCode] = useState(codeParam || '');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto search and verify payment if code exists in URL
  useEffect(() => {
    if (codeParam) {
      if (paymentParam === 'success') {
        // Tự động báo cho Backend kiểm tra giao dịch (cho localhost không xài webhook)
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/stripe/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderCode: codeParam })
        }).finally(() => {
          handleTrack({ preventDefault: () => {} });
        });
      } else {
        handleTrack({ preventDefault: () => {} });
      }
    }
  }, [codeParam, paymentParam]);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { item_id: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderCode.trim()) {
      setError('Vui lòng nhập mã đơn hàng');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await orderApi.trackOrder(orderCode.trim());
      if (res && res.success) {
        setOrder(res.data);
      } else {
        setError(res?.message || 'Không tìm thấy đơn hàng');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([id, qty]) => qty > 0)
      .map(([id, qty]) => ({ order_item_id: Number(id), quantity: qty }));

    if (itemsToReturn.length === 0) {
      return toast.error('Vui lòng chọn ít nhất 1 sản phẩm để trả');
    }

    if (!returnReason.trim()) {
      return toast.error('Vui lòng nhập lý do');
    }

    setIsSubmitting(true);
    try {
      await returnApi.createRequest({
        order_id: order.order_id,
        return_type: returnType,
        reason: returnReason,
        items: itemsToReturn
      });
      toast.success('Gửi yêu cầu thành công! Chúng tôi sẽ xử lý sớm nhất.');
      setIsReturnModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || error?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemSelect = (itemId, maxQty, val) => {
    const qty = Number(val);
    if (qty < 0 || qty > maxQty) return;
    setSelectedItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const statusMap = {
    'pending': { label: 'Chờ xác nhận', icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'confirmed': { label: 'Đã xác nhận', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'processing': { label: 'Đang xử lý', icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'shipping': { label: 'Đang giao hàng', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'completed': { label: 'Hoàn thành', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'cancelled': { label: 'Đã hủy', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    'returned': { label: 'Hoàn trả', icon: RotateCcw, color: 'text-rose-500', bg: 'bg-rose-500/10' }
  };

  const getStatusIndex = (status) => {
    const order = ['pending', 'confirmed', 'processing', 'shipping', 'completed'];
    return order.indexOf(status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.order_status) : -1;
  const isCancelledOrReturned = order && (order.order_status === 'cancelled' || order.order_status === 'returned');

  return (
    <>
      <div className="min-h-[80vh] bg-background pt-16 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">Tra cứu đơn hàng</h1>
            <p className="text-muted-foreground">Nhập mã đơn hàng của bạn để kiểm tra trạng thái vận chuyển</p>
          </div>

          {/* Form Search */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-8">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Ví dụ: ORD-123456-789"
                className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-xl outline-none focus:border-foreground transition-colors font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-foreground text-background px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tra cứu'}
            </button>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-red-500/10 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
        </div>

        {/* Order Result */}
        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/10 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">Đơn hàng <span className="font-mono text-primary">{order.order_code}</span></h3>
                  <p className="text-sm text-muted-foreground mt-1">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Trạng thái hiện tại</p>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2', statusMap[order.order_status]?.bg, statusMap[order.order_status]?.color)}>
                    {statusMap[order.order_status]?.label || order.order_status}
                  </span>
                </div>
              </div>

              {/* Timeline (Chỉ hiện nếu không bị hủy/hoàn) */}
              {!isCancelledOrReturned && (
                <div className="p-8 border-b border-border">
                  <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                    {/* Line behind icons */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
                    {/* Active line */}
                    <motion.div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10" 
                      initial={{ width: 0 }}
                      animate={{ width: currentStatusIndex >= 0 ? `${(currentStatusIndex / 4) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    {['pending', 'confirmed', 'processing', 'shipping', 'completed'].map((step, idx) => {
                      const isActive = idx <= currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex;
                      const StepIcon = statusMap[step].icon;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 bg-card relative z-10">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500',
                            isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground',
                            isCurrent && 'ring-4 ring-primary/20'
                          )}>
                            <StepIcon size={18} />
                          </div>
                          <span className={cn(
                            'text-[10px] sm:text-xs font-bold uppercase tracking-wider absolute -bottom-6 w-24 text-center',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {statusMap[step].label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="h-6" /> {/* Spacer for text */}
                </div>
              )}

              {isCancelledOrReturned && (
                <div className="p-8 border-b border-border text-center bg-rose-500/5">
                  <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                  <p className="font-bold text-rose-600">Đơn hàng này đã bị hủy hoặc hoàn trả.</p>
                </div>
              )}

              {/* Order Info & Items */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-sm mb-4">Thông tin nhận hàng</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {order.shipping_address_snapshot || 'Không có thông tin'}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-sm mb-4">Sản phẩm ({order.items?.length || 0})</h4>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {order.items?.map(item => (
                      <div key={item.item_id} className="flex gap-3">
                        <div className="w-16 h-20 bg-muted shrink-0 rounded overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-muted-foreground"/></div>
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-bold line-clamp-2">{item.product_name || `Sản phẩm #${item.variant_id}`}</p>
                          {(item.color_name || item.size_value) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.color_name} {item.color_name && item.size_value && '|'} {item.size_value}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-medium">SL: {item.quantity}</span>
                            <span className="font-bold">{Number(item.unit_price).toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-end">
                    <span className="font-bold uppercase tracking-wider text-sm">Tổng thanh toán</span>
                    <span className="text-xl font-black text-primary">{Number(order.total_amount).toLocaleString('vi-VN')}đ</span>
                  </div>

                  {order.order_status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-dashed border-border flex flex-col gap-3">
                      <p className="text-xs text-muted-foreground text-center">Bạn có thể tự hủy đơn hàng trong vòng 24 giờ kể từ lúc đặt. Tiền sẽ được hoàn lại tự động nếu đã thanh toán (Stripe).</p>
                      <button
                        onClick={async () => {
                          if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
                          try {
                            const res = await orderApi.cancelOrder(order.order_code, 'Khách hàng tự hủy qua tra cứu');
                            if (res && res.success) {
                              toast.success(res.message || 'Đã hủy đơn hàng');
                              // Reload
                              handleTrack({ preventDefault: () => {} });
                            } else {
                              toast.error(res.message || 'Không thể hủy đơn hàng');
                            }
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Lỗi kết nối Server');
                          }
                        }}
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-wider py-3 rounded transition-colors text-sm"
                      >
                        Hủy đơn hàng này
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 text-center border-t border-border flex flex-col sm:flex-row justify-center items-center gap-4">
                <p className="text-xs text-muted-foreground">
                  Nếu bạn cần hỗ trợ thêm về đơn hàng này, vui lòng <Link to="/store" className="text-primary underline">Liên hệ CSKH</Link>.
                </p>
                {order.order_status === 'completed' && (
                  <button 
                    onClick={() => {
                      setSelectedItems({});
                      setReturnReason('');
                      setIsReturnModalOpen(true);
                    }}
                    className="text-xs font-bold bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors"
                  >
                    Yêu cầu Đổi/Trả hàng
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Return Modal */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReturnModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <RotateCcw className="text-primary" /> Yêu cầu Đổi/Trả hàng
                </h2>
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full"><XCircle size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Chọn sản phẩm</h3>
                  <div className="space-y-3">
                    {order.items?.map(item => (
                      <div key={item.item_id} className="flex items-center gap-4 p-3 border border-border rounded-xl">
                        <div className="w-12 h-16 bg-muted shrink-0 rounded overflow-hidden">
                          {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="m-auto h-full text-muted-foreground"/>}
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-bold">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Mua: {item.quantity} | Giá: {Number(item.unit_price).toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-muted-foreground">SL Trả:</label>
                          <input 
                            type="number" 
                            min="0" 
                            max={item.quantity} 
                            value={selectedItems[item.item_id] || 0}
                            onChange={(e) => handleItemSelect(item.item_id, item.quantity, e.target.value)}
                            className="w-16 px-2 py-1 bg-muted border border-border rounded outline-none focus:border-primary text-center font-bold"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Loại yêu cầu</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rType" checked={returnType === 'return'} onChange={() => setReturnType('return')} className="w-4 h-4 accent-primary" />
                      <span className="font-medium">Trả hàng & Hoàn tiền</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="rType" checked={returnType === 'exchange'} onChange={() => setReturnType('exchange')} className="w-4 h-4 accent-primary" />
                      <span className="font-medium">Đổi hàng mới</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Lý do</h3>
                  <textarea 
                    rows="3" 
                    placeholder="Vui lòng ghi rõ lý do muốn đổi trả (Ví dụ: Sản phẩm bị lỗi chỉ, không đúng màu...)"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-lg">Hủy</button>
                <button 
                  onClick={handleReturnSubmit} 
                  disabled={isSubmitting} 
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Gửi Yêu Cầu'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default OrderTracking;
