import TableHeading from '../components/shared/TableHeading';
import Pagination from '../components/shared/Pagination';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, XCircle, Clock, Banknote, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import orderApi from '../api/orderApi';
import axiosClient from '../api/axiosClient';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 8;



const Payments = () => {
  const { role } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [refundPage, setRefundPage] = useState(1);
  const [refundPagination, setRefundPagination] = useState({ total: 0, totalPages: 1 });
  const [refundLoading, setRefundLoading] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('Tất cả');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await orderApi.getAllOrders({ limit: 100, page: 1 });
      if (res && res.success) {
        const items = [...(res.data.items || [])];
        const pages = Number(res.data.pagination?.totalPages || 1);
        for (let start = 2; start <= pages; start += 5) {
          const batch = await Promise.all(Array.from({ length: Math.min(5, pages - start + 1) }, (_, index) => orderApi.getAllOrders({ limit: 100, page: start + index })));
          batch.forEach(result => items.push(...(result.data.items || [])));
        }
        setOrders(items);
      }
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  }, []);

  const loadRefunds = useCallback(() => {
    if (role === 'admin') {
      setRefundLoading(true);
      axiosClient.get('/payments/refunds', { params: { page: refundPage, limit: 20 } }).then(result => {
        setRefunds(result.data); setRefundPagination(result.pagination);
        if (result.pagination.page !== refundPage) setRefundPage(result.pagination.page);
      }).catch(error => toast.error(error.message)).finally(() => setRefundLoading(false));
    }
  }, [role, refundPage]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const completeRefund = async (refund) => {
    const message = refund.payment_method === 'stripe' ? 'Hoàn tiền về thẻ cho khách ngay bây giờ?' : 'Bạn đã hoàn tiền thực tế cho khách qua phương thức gốc và muốn xác nhận?';
    if (!window.confirm(message)) return;
    setProcessingRefund(refund.refund_id);
    try {
      await axiosClient.put(`/payments/refunds/${refund.refund_id}/complete`, { confirmed: true });
      toast.success('Đã xác nhận hoàn tiền'); loadRefunds(); fetchOrders();
    } catch (error) { toast.error(error.message); }
    finally { setProcessingRefund(null); }
  };

  const transactions = orders.map((o) => {
    return {
      id: `TXN-${o.order_code.replace('ORD-', '')}`,
      orderId: o.order_code,
      customer: o.customer_name || 'Khách vãng lai',
      amount: Number(o.total_amount) || 0,
      method: o.payment_method === 'stripe' ? 'Thẻ Quốc tế (Stripe)' : (o.payment_method === 'bank_transfer' ? 'Chuyển khoản' : (o.payment_method === 'momo' ? 'Momo' : (o.payment_method === 'vnpay' ? 'VNPay' : 'Tiền mặt'))),
      status: o.payment_status === 'refunded' ? 'Đã hoàn tiền' : o.payment_status === 'success' ? 'Thành công' : (o.payment_status === 'pending' ? 'Đang xử lý' : 'Thất bại'),
      date: new Date(o.created_at).toLocaleDateString('vi-VN'),
    };
  });

  const tabs = ['Tất cả', 'Thành công', 'Đang xử lý', 'Thất bại', 'Đã hoàn tiền'];

  const filtered = transactions.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tất cả' || t.status === filter;
    return matchSearch && matchFilter;
  });

  const exportTransactions = () => {
    const escape = value => '"' + String(value ?? '').replace(/"/g, '""').replace(/^[=+@-]/, "'$&") + '"';
    const rows = [['Transaction', 'Order', 'Customer', 'Amount (VND)', 'Method', 'Status', 'Date'], ...filtered.map(t => [t.id, t.orderId, t.customer, t.amount, t.method, t.status, t.date])];
    const blob = new Blob(['\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'transactions.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán & Giao dịch</h1>
          <p className="text-muted-foreground text-sm mt-1">Lịch sử thanh toán và đối soát dòng tiền</p>
        </div>
        <button onClick={exportTransactions} className="flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold hover:bg-foreground/90 transition-colors w-full sm:w-auto">
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
          <p className="text-xs font-semibold text-emerald-500 mt-2">Tổng giao dịch đã ghi nhận thanh toán</p>
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
        <TableHeading title={"L\u1ecbch s\u1eed thanh to\u00e1n"} count={filtered.length} loading={isLoading} />
        <div className="admin-table-scroll overflow-x-auto">
          <table className="admin-data-table w-full text-sm min-w-[760px]">
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
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-muted-foreground">Đang tải...</td></tr>
                ) : paginated.map((txn, idx) => (
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
                        ) : txn.method === 'Thẻ Quốc tế (Stripe)' ? (
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded text-xs font-bold">Stripe</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs font-bold">{txn.method}</span>
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

      {role === 'admin' && <section className="space-y-3 pt-6 border-t border-border">
        <h2 className="text-xl font-bold">Yêu cầu hoàn tiền</h2>
        {refunds.length === 0 ? <p className="text-muted-foreground">Chưa có yêu cầu hoàn tiền.</p> : <div className="overflow-x-auto"><table className="admin-data-table w-full min-w-[600px] text-sm text-left"><thead><tr>{['Đơn hàng', 'Khách hàng', 'Số tiền', 'Phương thức', 'Trạng thái', 'Thao tác'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{refunds.map(refund => <tr key={refund.refund_id} className="border-t border-border"><td className="p-3">{refund.order_code}</td><td className="p-3">{refund.customer_name || 'Khách vãng lai'}</td><td className="p-3">{Number(refund.amount).toLocaleString('vi-VN')}đ</td><td className="p-3">{refund.payment_method}</td><td className="p-3">{refund.status === 'completed' ? 'Đã hoàn tiền' : refund.status === 'pending' ? 'Chờ xử lý' : 'Từ chối'}</td><td className="p-3">{refund.status === 'pending' && <button disabled={processingRefund !== null} onClick={() => completeRefund(refund)} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">{processingRefund === refund.refund_id ? 'Đang xử lý...' : refund.payment_method === 'stripe' ? 'Hoàn về thẻ' : 'Xác nhận đã hoàn'}</button>}</td></tr>)}</tbody></table></div>}
        <Pagination page={refundPage} totalPages={refundPagination.totalPages} totalItems={refundPagination.total} pageSize={20} disabled={refundLoading} onChange={setRefundPage} label="Hoàn tiền" />
      </section>}
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
