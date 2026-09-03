import React, { useState, useEffect } from 'react';
import { dummyCustomers } from '../utils/dummyData';
import { Search, Eye, Phone, Mail, Star, Loader2, Edit2, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import orderApi from '../api/orderApi';

/* ─────────────────────────────────────────── */
/*  Shared Pagination                         */
/* ─────────────────────────────────────────── */
const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-center gap-2 mt-8">
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

/* ─────────────────────────────────────────── */
/*  Status Badge Colors                        */
/* ─────────────────────────────────────────── */
const statusColors = {
  'completed':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'shipping':     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  'processing':   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'confirmed':    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
  'pending':      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  'cancelled':    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  'returned':     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels = {
  'completed':    'Đã giao',
  'shipping':     'Đang giao',
  'processing':   'Đang xử lý',
  'confirmed':    'Đã xác nhận',
  'pending':      'Chờ xác nhận',
  'cancelled':    'Đã huỷ',
  'returned':     'Trả hàng'
};

const rankColors = {
  'Mới':         'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  'Đồng':        'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  'Bạc':         'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Vàng':        'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  'Kim cương':   'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
};

const PAGE_SIZE_ORDERS = 8;
const PAGE_SIZE_CUSTOMERS = 6;

/* ─────────────────────────────────────────── */
/*  Order Management                          */
/* ─────────────────────────────────────────── */
export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const statuses = ['Tất cả', 'pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.getAllAdmin();
      if (res && res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, currentStatus) => {
    const nextStatusMap = {
      'pending': 'confirmed',
      'confirmed': 'processing',
      'processing': 'shipping',
      'shipping': 'completed'
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    if (window.confirm(`Chuyển trạng thái đơn sang "${statusLabels[nextStatus]}"?`)) {
      try {
        const res = await orderApi.updateStatus(id, { status: nextStatus });
        if (res.success) {
          fetchOrders();
        } else {
          alert(res.message || 'Lỗi');
        }
      } catch (err) {
        alert(err.message || 'Lỗi kết nối');
      }
    }
  };

  const handleCancelOrder = async (id) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng này?`)) {
      try {
        const res = await orderApi.updateStatus(id, { status: 'cancelled' });
        if (res.success) {
          fetchOrders();
        } else {
          alert(res.message || 'Lỗi');
        }
      } catch (err) {
        alert(err.message || 'Lỗi kết nối');
      }
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.order_code.toLowerCase().includes(search.toLowerCase()) || 
                        (o.customer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tất cả' || o.order_status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_ORDERS);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE_ORDERS, page * PAGE_SIZE_ORDERS);

  const statCounts = {
    'Chờ xác nhận': orders.filter(o => o.order_status === 'pending').length,
    'Đang xử lý':   orders.filter(o => o.order_status === 'processing').length,
    'Đang giao':    orders.filter(o => o.order_status === 'shipping').length,
    'Đã giao':      orders.filter(o => o.order_status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} đơn hàng tổng cộng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statCounts).map(([label, count]) => {
          const colors = { 'Chờ xác nhận': 'text-purple-600', 'Đang xử lý': 'text-amber-600', 'Đang giao': 'text-blue-600', 'Đã giao': 'text-emerald-600' };
          return (
            <div key={label} className="rounded-xl bg-card border border-border p-4">
              <p className={cn('text-2xl font-black', colors[label])}>{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm mã đơn, tên khách..."
            className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={cn('px-3 py-2 rounded-lg text-xs font-semibold border transition-all', filter === s ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/50')}
            >
              {s === 'Tất cả' ? s : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Mã đơn', 'Khách hàng', 'Địa chỉ', 'Ngày đặt', 'Kênh', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginated.map((order, i) => (
                    <motion.tr
                      key={order.order_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold">{order.order_code}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{order.customer_name || 'Khách vãng lai'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate" title={order.shipping_address_snapshot}>
                        {order.shipping_address_snapshot || 'Không có'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-center uppercase text-xs font-bold text-muted-foreground">{order.channel}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap text-primary">{Number(order.total_amount).toLocaleString('vi-VN')}đ</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap', statusColors[order.order_status])}>
                          {statusLabels[order.order_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {['pending', 'confirmed', 'processing', 'shipping'].includes(order.order_status) && (
                            <button 
                              onClick={() => handleUpdateStatus(order.order_id, order.order_status)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors" 
                              title="Cập nhật trạng thái tiếp theo"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {order.order_status === 'pending' && (
                            <button 
                              onClick={() => handleCancelOrder(order.order_id)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors" 
                              title="Hủy đơn"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng nào.</div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      {totalPages > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Hiển thị {(page - 1) * PAGE_SIZE_ORDERS + 1}–{Math.min(page * PAGE_SIZE_ORDERS, filtered.length)} trong {filtered.length} đơn
        </p>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Customer Management                       */
/* ─────────────────────────────────────────── */
export const CustomerManagement = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rankFilter, setRankFilter] = useState('Tất cả');

  const ranks = ['Tất cả', 'Mới', 'Đồng', 'Bạc', 'Vàng', 'Kim cương'];

  const filtered = dummyCustomers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search);
    const matchRank = rankFilter === 'Tất cả' || c.rank === rankFilter;
    return matchSearch && matchRank;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_CUSTOMERS);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE_CUSTOMERS, page * PAGE_SIZE_CUSTOMERS);

  const totalRevenue = dummyCustomers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Khách hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">{dummyCustomers.length} khách hàng · Tổng doanh thu: {(totalRevenue / 1000000).toFixed(1)}M đ</p>
      </div>

      {/* Rank Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ranks.filter(r => r !== 'Tất cả').map(rank => (
          <div key={rank} className={cn('rounded-xl border border-border p-3 text-center', rankColors[rank])}>
            <p className="text-xl font-black">{dummyCustomers.filter(c => c.rank === rank).length}</p>
            <p className="text-xs font-semibold mt-0.5">{rank}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm tên, email..."
            className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ranks.map(r => (
            <button
              key={r}
              onClick={() => { setRankFilter(r); setPage(1); }}
              className={cn('px-3 py-2 rounded-lg text-xs font-semibold border transition-all', rankFilter === r ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground/50')}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {paginated.map((customer, i) => (
            <motion.div
              key={customer.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-card border border-border p-5 hover:shadow-md hover:border-foreground/20 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/60 flex items-center justify-center text-foreground font-black text-lg flex-shrink-0">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{customer.name}</h3>
                  <p className="text-xs text-muted-foreground">Tham gia {customer.joined}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', rankColors[customer.rank])}>
                  {customer.rank}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{customer.orders}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Đơn hàng</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-base font-black">{(customer.totalSpent / 1000000).toFixed(1)}M</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Đã chi</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors truncate">
                  <Mail size={11} className="flex-shrink-0" />{customer.email}
                </a>
                <div className="flex items-center gap-2">
                  <Phone size={11} className="flex-shrink-0" />{customer.phone}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy khách hàng nào.</div>
      )}

      {totalPages > 1 && (
        <>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Trang {page} / {totalPages} · Hiển thị {(page - 1) * PAGE_SIZE_CUSTOMERS + 1}–{Math.min(page * PAGE_SIZE_CUSTOMERS, filtered.length)} trong {filtered.length} khách hàng
          </p>
        </>
      )}
    </div>
  );
};
