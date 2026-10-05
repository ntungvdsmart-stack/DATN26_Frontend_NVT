import React, { useState, useEffect } from 'react';
import orderApi from '../api/orderApi';
import { Search, Eye, Filter, ArrowRight, Truck, Package, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const PAGE_SIZE = 8;

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-center gap-2 mt-6">
    <button
      onClick={() => onChange(Math.max(1, page - 1))}
      disabled={page === 1}
      className="w-9 h-9 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
    >
      <ChevronLeft size={15} />
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={cn(
          'w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all',
          p === page ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'
        )}
      >
        {p}
      </button>
    ))}
    <button
      onClick={() => onChange(Math.min(totalPages, page + 1))}
      disabled={page === totalPages}
      className="w-9 h-9 flex items-center justify-center border border-border rounded-full disabled:opacity-30 hover:bg-muted transition-colors"
    >
      <ChevronRight size={15} />
    </button>
  </div>
);

const statusColors = {
  'Đã giao':       'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Đang giao':     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  'Đang xử lý':   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Chờ xác nhận': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  'Đã huỷ':       'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const OnlineSales = () => {
  const [onlineOrders, setOnlineOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Tất cả');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.getAllOrders();
      if (res && res.success) {
        setOnlineOrders(res.data.filter(o => o.channel?.toLowerCase() === 'online'));
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const tabs = ['Tất cả', 'pending', 'processing', 'shipping', 'completed'];
  const tabLabels = {
    'Tất cả': 'Tất cả',
    'pending': 'Chờ xác nhận',
    'processing': 'Đang xử lý',
    'shipping': 'Đang giao',
    'completed': 'Hoàn tất'
  };
  const STATUS_LABELS = {
    pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý',
    shipping: 'Đang giao', completed: 'Đã giao', cancelled: 'Đã huỷ', returned: 'Trả hàng'
  };

  const filtered = onlineOrders.filter(o => {
    const matchSearch = o.order_code?.toLowerCase().includes(search.toLowerCase()) || o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = 
      filter === 'Tất cả' ? true :
      o.order_status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bán hàng Online</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý và xử lý đơn hàng từ Website</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors">
            <Truck size={16} /> Đối tác giao hàng
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-purple-500">
            <Package size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Chờ xác nhận</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.order_status === 'pending').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <CreditCard size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Đang xử lý</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.order_status === 'processing').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <Truck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Đang giao</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.order_status === 'shipping').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-emerald-500">
            <ArrowRight size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Hoàn tất</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.order_status === 'completed').length}</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="flex gap-1 border border-border p-1 rounded-lg bg-muted/50 overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => { setFilter(t); setPage(1); }}
                className={cn(
                  'px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                  filter === t ? 'bg-background shadow-sm' : 'hover:bg-background/50 text-muted-foreground'
                )}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm mã đơn, tên khách..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors bg-background"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Đơn hàng</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Khách hàng / Địa chỉ</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Thanh toán</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <AnimatePresence>
                {isLoading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-muted-foreground">Đang tải...</td></tr>
                ) : paginated.map((order, idx) => (
                  <motion.tr
                    key={order.order_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-bold text-foreground">{order.order_code}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{order.customer_name || 'Khách vãng lai'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{order.shipping_address_snapshot || 'Nhận tại cửa hàng'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary">{Number(order.total_amount).toLocaleString('vi-VN')}đ</p>
                      <p className={cn("text-[10px] uppercase font-bold mt-0.5", order.payment_status === 'success' ? 'text-emerald-500' : 'text-amber-500')}>
                        {order.payment_method || 'Tiền mặt'} ({order.payment_status === 'success' ? 'Đã thanh toán' : 'Chưa thanh toán'})
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider', statusColors[STATUS_LABELS[order.order_status]] || 'bg-muted text-muted-foreground')}>
                        {STATUS_LABELS[order.order_status] || order.order_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="px-3 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-auto">
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng Online nào.</div>
      )}

      {totalPages > 1 && (
        <>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Trang {page} / {totalPages} · Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} đơn
          </p>
        </>
      )}
    </div>
  );
};

export default OnlineSales;
