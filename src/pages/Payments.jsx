import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, CreditCard, Banknote, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { dummyOrders } from '../utils/dummyData';
import { statsData } from '../utils/statsData';

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

// Mock payment transactions based on dummyOrders
const transactions = dummyOrders.map((o, i) => {
  const isVNPay = i % 3 === 0;
  const isMomo = i % 3 === 1;
  return {
    id: `TXN-${o.id.replace('ORD-', '')}`,
    orderId: o.id,
    customer: o.customer,
    amount: o.total,
    method: isVNPay ? 'VNPay' : isMomo ? 'Momo' : 'Chuyển khoản',
    status: o.status === 'Đã huỷ' ? 'Thất bại' : o.status === 'Chờ xác nhận' ? 'Đang xử lý' : 'Thành công',
    date: o.date,
  };
});

const Payments = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Tất cả');

  const tabs = ['Tất cả', 'Thành công', 'Đang xử lý', 'Thất bại'];

  const filtered = transactions.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tất cả' || t.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán & Giao dịch</h1>
          <p className="text-muted-foreground text-sm mt-1">Lịch sử thanh toán và đối soát dòng tiền</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors w-full sm:w-auto">
          <Download size={16} /> Xuất đối soát
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Tổng thu thành công</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Banknote size={20} /></div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {(transactions.filter(t => t.status === 'Thành công').reduce((s, t) => s + t.amount, 0) / 1000000).toFixed(1)}M đ
          </p>
          <p className="text-xs font-semibold text-emerald-500 mt-2">+12.5% so với tuần trước</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Đang chờ xử lý</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Clock size={20} /></div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {(transactions.filter(t => t.status === 'Đang xử lý').reduce((s, t) => s + t.amount, 0) / 1000000).toFixed(1)}M đ
          </p>
          <p className="text-xs font-semibold text-amber-500 mt-2">{transactions.filter(t => t.status === 'Đang xử lý').length} giao dịch chờ</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Thất bại / Hoàn tiền</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center"><XCircle size={20} /></div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {(transactions.filter(t => t.status === 'Thất bại').reduce((s, t) => s + t.amount, 0) / 1000).toFixed(0)}K đ
          </p>
          <p className="text-xs font-semibold text-red-500 mt-2">{transactions.filter(t => t.status === 'Thất bại').length} giao dịch lỗi</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex gap-2 border border-border p-1 rounded-lg bg-muted/50 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => { setFilter(t); setPage(1); }}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors',
                filter === t ? 'bg-background shadow-sm text-foreground' : 'hover:bg-background/50 text-muted-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tra cứu mã giao dịch, khách hàng..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors bg-background"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Mã GD / Đơn Hàng</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Thời gian</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Khách hàng</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Số tiền</th>
                <th className="text-left px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Kênh thanh toán</th>
                <th className="text-right px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <AnimatePresence>
                {paginated.map((txn, idx) => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-sm font-bold text-foreground">{txn.id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{txn.orderId}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-medium">{txn.date}</td>
                    <td className="px-5 py-4 font-semibold">{txn.customer}</td>
                    <td className="px-5 py-4">
                      <p className={cn('font-bold', txn.status === 'Thất bại' ? 'text-muted-foreground line-through' : 'text-primary')}>
                        {txn.amount.toLocaleString('vi-VN')}đ
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {txn.method === 'VNPay' ? (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-bold">VNPay</span>
                        ) : txn.method === 'Momo' ? (
                          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-600 rounded text-xs font-bold">MoMo</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-bold">Chuyển khoản</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {txn.status === 'Thành công' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 size={14} />Thành công</span>}
                      {txn.status === 'Đang xử lý' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-bold"><Clock size={14} />Đang xử lý</span>}
                      {txn.status === 'Thất bại' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-xs font-bold"><XCircle size={14} />Thất bại</span>}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy giao dịch nào.</div>
      )}

      {totalPages > 1 && (
        <>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            Trang {page} / {totalPages} · Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} trong {filtered.length} giao dịch
          </p>
        </>
      )}
    </div>
  );
};

export default Payments;
