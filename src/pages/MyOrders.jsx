import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw, Search, ArrowRight, ShoppingBag, Truck, CheckCircle2, Clock3, SlidersHorizontal, AlertCircle } from 'lucide-react';
import userApi from '../api/userApi';
import Pagination from '../components/shared/Pagination';

const statuses = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy', returned: 'Đã trả hàng' };
const statusClass = status => status === 'completed' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : status === 'cancelled' ? 'bg-red-500/10 text-red-700 dark:text-red-400' : status === 'shipping' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'bg-amber-500/10 text-amber-800 dark:text-amber-300';
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    let active = true;
    userApi.getMyOrders().then(result => { if (active) { setOrders(result.data || []); setError(''); } })
      .catch(err => { if (active) setError(err.message || 'Không tải được đơn hàng'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const refresh = () => { setLoading(true); setError(''); setReload(value => value + 1); };
  const clearFilters = () => { setSearch(''); setStatus(''); setPage(1); };
  const filtered = orders.filter(order => (!status || order.order_status === status) && String(order.order_code).toLowerCase().includes(search.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, totalPages);
  const summaries = [
    { label: 'Tất cả đơn', count: orders.length, icon: Package },
    { label: 'Đang xử lý', count: orders.filter(order => ['pending', 'confirmed', 'processing'].includes(order.order_status)).length, icon: Clock3 },
    { label: 'Đang giao', count: orders.filter(order => order.order_status === 'shipping').length, icon: Truck },
    { label: 'Hoàn thành', count: orders.filter(order => order.order_status === 'completed').length, icon: CheckCircle2 }
  ];
  return <div className="customer-page"><main className="customer-container space-y-6 sm:space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="customer-eyebrow">TÀI KHOẢN / ĐƠN HÀNG</p><h1 className="customer-title">Đơn hàng của tôi</h1><p className="customer-description">Mọi đơn mua, một nơi theo dõi.</p></div>
      <button disabled={loading} onClick={refresh} className="customer-secondary"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Làm mới</button>
    </header>
    <section aria-label="Tổng quan đơn hàng" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {summaries.map(({ label, count, icon: Icon }) => <div key={label} className="customer-stat"><span className="customer-stat-icon"><Icon size={18} strokeWidth={1.6} /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">{loading || error ? '—' : count}</p></div></div>)}
    </section>
    <section className="customer-surface overflow-hidden" aria-label="Danh sách đơn hàng">
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1 min-w-0"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm mã đơn hàng" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} maxLength={100} placeholder="Tìm theo mã đơn hàng..." className="customer-input w-full pl-11" /></label>
        <div className="relative"><SlidersHorizontal size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" /><select aria-label="Trạng thái đơn hàng" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="customer-input w-full sm:w-52 pl-10 pr-3"><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {loading ? <div role="status" className="p-5 space-y-4"><span className="sr-only">Đang tải đơn hàng</span>{[1,2,3].map(value => <div key={value} className="h-24 rounded-xl bg-muted/60 animate-pulse" />)}</div> : error ? <div role="alert" className="customer-empty"><AlertCircle className="text-destructive" size={32} /><h2>Chưa tải được đơn hàng</h2><p>{error}</p><button className="customer-secondary" onClick={refresh}>Thử lại</button></div> : !filtered.length ? <div className="customer-empty">
        <div className="customer-empty-icon">{orders.length ? <Search size={30} strokeWidth={1.4} /> : <ShoppingBag size={32} strokeWidth={1.4} />}</div>
        <h2>{orders.length ? 'Chưa tìm thấy đơn phù hợp' : 'Đơn hàng đầu tiên đang chờ bạn'}</h2>
        <p>{orders.length ? 'Thử một mã đơn khác hoặc xóa bộ lọc để xem tất cả đơn hàng.' : 'Khám phá những món đồ yêu thích. Đơn mua và tiến độ giao hàng sẽ xuất hiện tại đây.'}</p>
        {orders.length ? <button className="customer-primary" onClick={clearFilters}>Xóa bộ lọc<RefreshCw size={15} /></button> : <Link to="/store/products" className="customer-primary">Khám phá sản phẩm<ArrowRight size={16} /></Link>}
      </div> : <>
        <div className="px-4 sm:px-5 py-3 text-xs text-muted-foreground">{filtered.length} đơn hàng{search || status ? ' phù hợp' : ''}</div>
        <div className="px-4 sm:px-5 pb-5 space-y-3">{filtered.slice((currentPage - 1) * 10, currentPage * 10).map(order => <article key={order.order_id} className="order-summary-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 mb-4"><span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Package size={15} />{order.channel === 'pos' ? 'Mua tại quầy' : 'Mua trực tuyến'}</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(order.order_status)}`}>{statuses[order.order_status] || order.order_status}</span></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="min-w-0"><h2 className="font-semibold break-all">{order.order_code}</h2><p className="text-xs text-muted-foreground mt-1.5">{new Date(order.created_at).toLocaleString('vi-VN')}</p></div><div className="flex items-center justify-between sm:justify-end gap-5"><strong className="text-lg font-semibold whitespace-nowrap">{Number(order.total_amount || 0).toLocaleString('vi-VN')}đ</strong><Link to={`/store/tracking?code=${encodeURIComponent(order.order_code)}`} className="customer-secondary text-xs">Chi tiết<ArrowRight size={15} /></Link></div></div>
        </article>)}</div>
        {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={10} />}
      </>}
    </section>
    <p className="text-center text-xs text-muted-foreground">Cần hỗ trợ? <Link to="/store/faq" className="underline underline-offset-4 hover:text-foreground">Xem câu hỏi thường gặp</Link> hoặc mở chat với shop.</p>
  </main></div>;
}
