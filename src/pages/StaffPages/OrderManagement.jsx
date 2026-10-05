import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, X, RefreshCw, Eye, Tag, AlertCircle, ShoppingCart, User, Smartphone, Monitor } from 'lucide-react';
import orderApi from '../../api/orderApi';
import moment from 'moment';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  processing: { label: 'Đang xử lý', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  shipping: { label: 'Đang giao hàng', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  returned: { label: 'Trả hàng', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, pending, shipping, completed, cancelled

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAllOrders();
      if (res && res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await orderApi.getOrderById(orderId);
      if (res && res.success) {
        setSelectedOrder(res.data);
        setNote('');
      }
    } catch (err) {
      alert('Lỗi tải chi tiết đơn hàng');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Xác nhận chuyển đơn sang trạng thái: ${STATUS_MAP[newStatus].label}?`)) return;
    setIsUpdating(true);
    try {
      const res = await orderApi.updateStatus(selectedOrder.order_id, newStatus, note);
      if (res && res.success) {
        alert('Cập nhật thành công');
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.message || 'Lỗi hệ thống');
    }
    setIsUpdating(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchTab = activeTab === 'all' || 
                     (activeTab === 'pending' && ['pending', 'confirmed', 'processing'].includes(o.order_status)) ||
                     (activeTab === 'shipping' && o.order_status === 'shipping') ||
                     (activeTab === 'completed' && o.order_status === 'completed') ||
                     (activeTab === 'cancelled' && ['cancelled', 'returned'].includes(o.order_status));
    const matchSearch = o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">Theo dõi, xử lý và cập nhật trạng thái giao hàng</p>
        </div>
        <button onClick={fetchOrders} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors" title="Tải lại">
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Chờ xử lý' },
          { id: 'shipping', label: 'Đang giao' },
          { id: 'completed', label: 'Đã hoàn thành' },
          { id: 'cancelled', label: 'Đã hủy/Trả' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 relative transition-colors ${activeTab === tab.id ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="orderTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Search & List */}
      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" placeholder="Tìm theo mã đơn hàng, tên khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold text-muted-foreground">Mã Đơn</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Khách Hàng</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Kênh Bán</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Tổng Tiền</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Trạng Thái</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Ngày Tạo</th>
                <th className="px-4 py-3 font-bold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-10"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary"/></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-10 text-muted-foreground">Không tìm thấy đơn hàng nào.</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.order_id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-bold font-mono text-xs">{order.order_code}</td>
                    <td className="px-4 py-3">
                      {order.customer_name ? (
                         <div className="font-medium">{order.customer_name}</div>
                      ) : (
                         <span className="text-xs text-muted-foreground italic">Khách vãng lai</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.channel === 'pos' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded w-max"><Monitor className="w-3 h-3"/> POS</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded w-max"><Smartphone className="w-3 h-3"/> Online</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded border text-[11px] font-bold uppercase tracking-wider ${STATUS_MAP[order.order_status]?.color || 'bg-muted text-muted-foreground'}`}>
                        {STATUS_MAP[order.order_status]?.label || order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {moment(order.created_at).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleViewOrder(order.order_id)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết đơn hàng */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="w-full max-w-2xl bg-background h-full shadow-2xl flex flex-col border-l border-border"
            >
              <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black font-mono">{selectedOrder.order_code}</h2>
                    <span className={`px-2 py-1 rounded border text-xs font-bold uppercase ${STATUS_MAP[selectedOrder.order_status]?.color}`}>
                      {STATUS_MAP[selectedOrder.order_status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ngày tạo: {moment(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5"/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"><User className="w-3 h-3"/> Khách hàng</h3>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border text-sm space-y-1">
                      {selectedOrder.customer_name ? (
                        <>
                          <div className="font-bold">{selectedOrder.customer_name}</div>
                          <div>SĐT: {selectedOrder.customer_phone || '---'}</div>
                          {selectedOrder.shipping_address_snapshot && <div className="text-muted-foreground text-xs mt-2 border-t border-border/50 pt-2">{selectedOrder.shipping_address_snapshot}</div>}
                        </>
                      ) : (
                        <div className="text-muted-foreground italic">Khách vãng lai mua tại quầy</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"><Tag className="w-3 h-3"/> Kênh & Thu ngân</h3>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border text-sm space-y-1">
                      <div className="font-bold">Kênh: {selectedOrder.channel === 'pos' ? 'Tại quầy (POS)' : 'Online'}</div>
                      <div>Thu ngân: {selectedOrder.staff_name || 'Hệ thống'}</div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"><ShoppingCart className="w-3 h-3"/> Sản phẩm ({selectedOrder.items?.length || 0})</h3>
                  <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                    {selectedOrder.items?.map(item => (
                      <div key={item.order_item_id} className="p-3 flex gap-3 bg-background">
                        <div className="flex-1">
                          <div className="font-bold text-sm">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku} | {item.color_name} {item.size_value ? `- Size ${item.size_value}` : ''}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div>{item.quantity} x <span className="font-bold">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(item.unit_price)}</span></div>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-muted/20 space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground"><span>Tạm tính:</span> <span>{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(selectedOrder.subtotal_amount)}</span></div>
                      <div className="flex justify-between text-green-600"><span>Giảm giá:</span> <span>-{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(selectedOrder.discount_amount)}</span></div>
                      <div className="flex justify-between font-black text-primary text-base pt-2 border-t border-border">
                        <span>Tổng tiền:</span> <span>{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Lịch sử trạng thái</h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {selectedOrder.history?.map(hist => (
                      <div key={hist.history_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-primary/20"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-border bg-background shadow-sm space-y-1">
                          <div className="flex justify-between">
                            <span className={`text-[10px] font-bold uppercase ${STATUS_MAP[hist.status]?.color || 'text-muted-foreground'} px-1.5 py-0.5 rounded`}>{STATUS_MAP[hist.status]?.label}</span>
                            <span className="text-[10px] text-muted-foreground">{moment(hist.changed_at).format('DD/MM HH:mm')}</span>
                          </div>
                          <div className="text-xs">{hist.note}</div>
                          <div className="text-[10px] text-muted-foreground italic">Bởi: {hist.changed_by_name || 'Hệ thống'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 border-t border-border bg-background shrink-0 space-y-3">
                <input type="text" placeholder="Ghi chú cập nhật (Tùy chọn)..." value={note} onChange={e=>setNote(e.target.value)} className="w-full text-sm p-2 rounded-lg border border-border bg-background focus:border-primary outline-none" />
                
                <div className="flex gap-2 flex-wrap">
                  {/* Các nút đổi trạng thái tùy thuộc vào trạng thái hiện tại */}
                  {['pending', 'confirmed'].includes(selectedOrder.order_status) && (
                    <button disabled={isUpdating} onClick={() => handleUpdateStatus('processing')} className="flex-1 bg-indigo-500 text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Xác nhận / Xử lý</button>
                  )}
                  {['processing'].includes(selectedOrder.order_status) && (
                    <button disabled={isUpdating} onClick={() => handleUpdateStatus('shipping')} className="flex-1 bg-cyan-500 text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Giao hàng</button>
                  )}
                  {['shipping', 'pending', 'confirmed', 'processing'].includes(selectedOrder.order_status) && (
                    <button disabled={isUpdating} onClick={() => handleUpdateStatus('completed')} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Hoàn thành</button>
                  )}
                  {['pending', 'confirmed', 'processing'].includes(selectedOrder.order_status) && (
                    <button disabled={isUpdating} onClick={() => handleUpdateStatus('cancelled')} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Hủy đơn</button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderManagement;
