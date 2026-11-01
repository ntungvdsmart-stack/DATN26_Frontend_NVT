import OrderProgress from '../components/shared/OrderProgress';
import ProductImage from '../components/shared/ProductImage';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Package, Truck, CheckCircle2, RotateCcw, AlertCircle, XCircle, MapPin, ReceiptText, ArrowLeft, MessageCircle } from 'lucide-react';
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

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnType, setReturnType] = useState('return');
  const [returnReason, setReturnReason] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { item_id: quantity }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTrack = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const queryCode = (orderCode || codeParam || '').trim();
    if (!queryCode) {
      setError('Vui lòng nhập mã đơn hàng');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await orderApi.trackOrder(queryCode);
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
  }, [orderCode, codeParam]);

  useEffect(() => {
    if (!order?.order_code || order.payment_status !== 'pending' || !['stripe', 'vnpay', 'momo'].includes(order.payment_method) || order.order_status === 'cancelled') return;
    let active = true;
    const timer = setInterval(() => {
      orderApi.trackOrder(order.order_code).then(result => { if (active) setOrder(result.data); }).catch(() => {});
    }, 5000);
    return () => { active = false; clearInterval(timer); };
  }, [order?.order_code, order?.payment_status, order?.payment_method, order?.order_status]);

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
          handleTrack();
        });
      } else {
        handleTrack();
      }
    }
  }, [codeParam, paymentParam, handleTrack]);

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
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

  const isCancelledOrReturned = order && (order.order_status === 'cancelled' || order.order_status === 'returned');

  return (
    <>
      <div className="customer-page">
        <div className="customer-container">
          <div className="text-center mb-10">
            <h1 className="customer-title mb-3">Tra cứu đơn hàng</h1>
            <p className="text-muted-foreground">Nhập mã đơn hàng của bạn để kiểm tra trạng thái vận chuyển</p>
          </div>

          {/* Form Search */}
          <div className="customer-surface p-4 sm:p-6 mb-8">
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
              className="order-detail customer-surface overflow-hidden"
            >
              <div className="p-5 sm:p-7 border-b border-border flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Đơn hàng <span className="block mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-foreground break-all">{order.order_code}</span></h3>
                  <p className="text-sm text-muted-foreground mt-1">Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Trạng thái hiện tại</p>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2', statusMap[order.order_status]?.bg, statusMap[order.order_status]?.color)}>
                    {statusMap[order.order_status]?.label || order.order_status}
                  </span>
                </div>
              </div>

              {!isCancelledOrReturned && <section className="p-5 sm:p-8 border-b border-border"><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">Tiến độ đơn hàng</h3><OrderProgress status={order.order_status} /></section>}

              {isCancelledOrReturned && (
                <div className="p-8 border-b border-border text-center bg-rose-500/5">
                  <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                  <p className="font-bold text-rose-600">Đơn hàng này đã bị hủy hoặc hoàn trả.</p>
                </div>
              )}

              {/* Order Info & Items */}
              <div className="p-4 sm:p-7 grid grid-cols-1 lg:grid-cols-[.85fr_1.15fr] gap-5 sm:gap-7">
                <div className="rounded-2xl border border-border bg-muted/20 p-5 h-fit">
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2"><MapPin size={17} className="text-muted-foreground" />Thông tin nhận hàng</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-7">
                    {order.shipping_address_snapshot ? order.shipping_address_snapshot.replace(/,\s*(?=SĐT:|ĐT:|ĐC:)/g, '\n') : 'Không có thông tin'}
                  </p>
                  {order.payment_method && <div className="mt-5 pt-4 border-t border-border/70"><p className="text-xs text-muted-foreground mb-1">Phương thức thanh toán</p><p className="text-sm font-medium">{{ cash: 'Tiền mặt / COD', stripe: 'Thẻ qua Stripe', bank_transfer: 'Chuyển khoản', vnpay: 'VNPAY', momo: 'MoMo' }[order.payment_method] || order.payment_method}</p></div>}
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-5 flex items-center gap-2"><Package size={17} className="text-muted-foreground" />Sản phẩm ({order.items?.length || 0})</h4>
                  <div className="space-y-4 max-h-[420px] overflow-y-auto overscroll-contain pr-1">
                    {order.items?.map(item => (
                      <div key={item.item_id} className="flex gap-4 rounded-xl border border-border/70 p-3 sm:p-4">
                        <div className="w-16 h-20 sm:w-20 sm:h-24 bg-muted shrink-0 rounded-lg overflow-hidden">
                          {item.image_url ? (
                            <ProductImage src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-muted-foreground"/></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-semibold line-clamp-2 leading-relaxed">{item.product_name || `Sản phẩm #${item.variant_id}`}</p>
                          {(item.color_name || item.size_value) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.color_name} {item.color_name && item.size_value && '|'} {item.size_value}
                            </p>
                          )}
                          <div className="flex flex-wrap justify-between items-center gap-2 mt-3">
                            <span className="text-xs font-medium">SL: {item.quantity}</span>
                            <span className="font-bold">{Number(Number(item.unit_price) * Number(item.quantity)).toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <dl className="mt-5 space-y-2 text-sm">
                    {order.subtotal_amount != null && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Tạm tính</dt><dd>{Number(order.subtotal_amount).toLocaleString('vi-VN')}đ</dd></div>}
                    {order.shipping_fee != null && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Phí giao hàng</dt><dd>{Number(order.shipping_fee) === 0 ? 'Miễn phí' : `${Number(order.shipping_fee).toLocaleString('vi-VN')}đ`}</dd></div>}
                    {Number(order.discount_amount) + Number(order.loyalty_discount || 0) > 0 && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Giảm giá</dt><dd className="text-emerald-600">−{(Number(order.discount_amount || 0) + Number(order.loyalty_discount || 0)).toLocaleString('vi-VN')}đ</dd></div>}
                  </dl>
                  <div className="mt-4 rounded-xl bg-muted/40 p-4 sm:p-5 flex flex-wrap gap-3 justify-between items-center">
                    <span className="font-medium text-sm flex items-center gap-2"><ReceiptText size={17} />Tổng thanh toán</span>
                    <span className="text-2xl font-semibold tracking-tight text-foreground">{Number(order.total_amount).toLocaleString('vi-VN')}đ</span>
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
              
              <div className="p-5 bg-muted/20 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-4"><Link to="/store/orders" className="text-xs font-medium inline-flex items-center gap-1.5 hover:underline"><ArrowLeft size={14} />Đơn hàng của tôi</Link><Link to="/store/faq" className="text-xs text-muted-foreground inline-flex items-center gap-1.5 hover:text-foreground"><MessageCircle size={14} />Cần hỗ trợ? Xem hỏi đáp</Link></div>
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
          <ModalLayer onClose={() => setIsReturnModalOpen(false)} label="Yêu cầu đổi trả"><div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                          <ProductImage src={item.image_url} alt={item.product_name || ''} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-bold">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Mua: {item.quantity} | Giá: {Number(Number(item.unit_price) * Number(item.quantity)).toLocaleString('vi-VN')}đ</p>
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
          </div></ModalLayer>
        )}
      </AnimatePresence>
      </div>
    </>
  );
};

export default OrderTracking;
