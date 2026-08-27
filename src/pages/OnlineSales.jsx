import React, { useState } from 'react';
import { dummyOrders } from '../utils/dummyData';
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Tất cả');

  const tabs = ['Tất cả', 'Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Hoàn tất'];

  const onlineOrders = dummyOrders.filter(o => o.channel === 'Online');

  const filtered = onlineOrders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = 
      filter === 'Tất cả' ? true :
      filter === 'Hoàn tất' ? o.status === 'Đã giao' :
      o.status === filter;
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
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.status === 'Chờ xác nhận').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-amber-500">
            <CreditCard size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Đang xử lý</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.status === 'Đang xử lý').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-blue-500">
            <Truck size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Đang giao</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.status === 'Đang giao').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-emerald-500">
            <ArrowRight size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Hoàn tất</span>
          </div>
          <p className="text-2xl font-black">{onlineOrders.filter(o => o.status === 'Đã giao').length}</p>
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
                {t}
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
                {paginated.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-bold text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.date} · {order.items} SP</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{order.customer}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{order.address}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary">{order.total.toLocaleString('vi-VN')}đ</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-500 mt-0.5">Đã thanh toán (VNPay)</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider', statusColors[order.status])}>
                        {order.status}
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
