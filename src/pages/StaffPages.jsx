import React, { useState, useEffect } from 'react';
import { dummyCustomers } from '../utils/dummyData';
import { Search, Eye, Phone, Mail, Star, Loader2, Edit2, CheckCircle2, X, Printer, MapPin, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import orderApi from '../api/orderApi';
import customerApi from '../api/customerApi';
import InvoiceTemplate from '../components/admin/InvoiceTemplate';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

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
  const { role } = useAuth();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE_ORDERS, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tất cả');
  const [page, setPage] = useState(1);
  const statuses = ['Tất cả', 'pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];

  const [assignModal, setAssignModal] = useState(null);
  const [branchSuggestions, setBranchSuggestions] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignStep, setAssignStep] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const printRef = useRef(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE_ORDERS, search: debouncedSearch };
      if (filter !== 'Tất cả') params.status = filter;
      const res = await orderApi.getAllAdmin(params);
      if (res && res.success) {
        setOrders(res.data.items || []);
        setCounts(res.data.counts || {});
        setPagination(res.data.pagination || { page: 1, limit: PAGE_SIZE_ORDERS, totalPages: 1, total: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filter, debouncedSearch]);

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
        const res = await orderApi.updateStatus(id, nextStatus);
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

  const handleOpenAssignModal = async (order) => {
    setAssignModal(order);
    setBranchSuggestions([]);
    setSelectedBranchId('');
    setSelectedStaffId('');
    setAssignStep(1);
    try {
        const res = await orderApi.getBranchSuggestions(order.order_id);
        if(res && res.success) {
            setBranchSuggestions(res.data);
            if (res.data.length > 0 && res.data[0].hasEnoughStock) setSelectedBranchId(res.data[0].branch_id);
        }
    } catch(err) {
        alert('Lỗi lấy danh sách gợi ý');
    }
  };

  const submitAssign = async () => {
    if(!selectedBranchId || !selectedStaffId) return alert('Vui lòng chọn chi nhánh và nhân viên');
    setIsAssigning(true);
    try {
        const res = await orderApi.assignOrder(assignModal.order_id, {
            branch_id: selectedBranchId,
            staff_id: selectedStaffId
        });
        if(res.success) {
            setAssignModal(null);
            fetchOrders();
        } else {
            alert(res.message);
        }
    } catch(err) {
        alert(err.response?.data?.message || 'Lỗi phân công');
    }
    setIsAssigning(false);
  };

  const handleCancelOrder = async (id) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng này?`)) {
      try {
        const res = await orderApi.updateStatus(id, 'cancelled');
        if (res.success) {
          fetchOrders();
        } else {
          alert(res.message || 'Lỗi');
        }
      } catch (err) {
        alert('Có lỗi xảy ra');
      }
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn đơn hàng và các dữ liệu liên quan khỏi hệ thống! Bạn có chắc chắn muốn xóa?')) {
      try {
        const res = await orderApi.deleteOrder(id);
        if (res.success) {
          fetchOrders();
        } else {
          alert(res.message || 'Lỗi xóa đơn hàng');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn hàng');
      }
    }
  };

  const handlePrint = async (orderId) => {
    try {
      const res = await orderApi.getOrderById(orderId);
      if (res && res.success) {
        setPrintingOrder(res.data);
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        alert('Không lấy được chi tiết đơn hàng');
      }
    } catch (err) {
      alert('Lỗi khi lấy thông tin đơn hàng');
    }
  };

  const statCounts = {
    'Chờ xác nhận': counts.pending || 0,
    'Đang xử lý':   counts.processing || 0,
    'Đang giao':    counts.shipping || 0,
    'Hoàn thành / Đã giao': counts.completed || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Đơn hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">{pagination.total} đơn hàng tổng cộng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statCounts).map(([label, count]) => {
          const colors = { 'Chờ xác nhận': 'text-purple-600', 'Đang xử lý': 'text-amber-600', 'Đang giao': 'text-blue-600', 'Hoàn thành / Đã giao': 'text-emerald-600' };
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
              {s === 'Tất cả' ? s : (s === 'completed' ? 'Hoàn thành / Đã giao' : statusLabels[s])}
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
                  {orders.map((order, i) => (
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
                          {order.channel === 'pos' && order.order_status === 'completed' ? 'Hoàn thành' : statusLabels[order.order_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.channel === 'online' && !order.branch_name && ['pending', 'confirmed'].includes(order.order_status) && (
                            <button
                              onClick={() => handleOpenAssignModal(order)}
                              className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors"
                              title="Phân công chi nhánh"
                            >
                              <MapPin size={16} />
                            </button>
                          )}
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
                              className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors" 
                              title="Hủy đơn"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteOrder(order.order_id)}
                              className="p-1.5 text-red-600 hover:bg-red-600/10 rounded-md transition-colors" 
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handlePrint(order.order_id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-500/10 rounded-md transition-colors" 
                            title="In hóa đơn"
                          >
                            <Printer size={16} />
                          </button>
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

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">Không tìm thấy đơn hàng nào.</div>
      )}

      {pagination.totalPages > 1 && <Pagination page={page} totalPages={pagination.totalPages} onChange={setPage} />}

      {pagination.total > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Hiển thị {(page - 1) * PAGE_SIZE_ORDERS + 1}–{Math.min(page * PAGE_SIZE_ORDERS, pagination.total)} trong {pagination.total} đơn
        </p>
      )}

      {/* Component In Hóa Đơn (Bị ẩn, chỉ hiện khi in) */}
      <InvoiceTemplate ref={printRef} order={printingOrder} />

      {/* Modal Phân công */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModal(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Phân công đơn hàng {assignModal.order_code}</h2>
              <div className="space-y-4">
                {assignStep === 1 ? (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-2">Bước 1: Chọn chi nhánh (Gợi ý theo khoảng cách)</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {branchSuggestions.map(b => (
                        <div 
                          key={b.branch_id} 
                          onClick={() => { if(b.hasEnoughStock) { setSelectedBranchId(b.branch_id); } }}
                          className={cn("p-3 rounded-xl border cursor-pointer transition-all", 
                            selectedBranchId === b.branch_id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30",
                            !b.hasEnoughStock && "opacity-50 grayscale cursor-not-allowed"
                          )}
                        >
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-bold">{b.branch_name}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">{b.address || 'Không có địa chỉ'}</p>
                              </div>
                              <div className="text-right">
                                  {b.distance !== null && <p className="text-xs font-semibold text-primary">{Number(b.distance).toFixed(1)} km</p>}
                                  {!b.hasEnoughStock && <p className="text-xs text-red-500 font-bold mt-1">Không đủ tồn kho</p>}
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground block mb-2">Bước 2: Chọn nhân viên xử lý</label>
                    <div className="p-3 bg-muted/30 rounded-xl mb-4 border border-border">
                        <p className="text-sm"><strong>Chi nhánh:</strong> {branchSuggestions.find(b => b.branch_id === selectedBranchId)?.branch_name}</p>
                    </div>
                    <select 
                      value={selectedStaffId} 
                      onChange={e => setSelectedStaffId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border bg-background outline-none"
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {(branchSuggestions.find(b => b.branch_id === selectedBranchId)?.staff || []).map(s => (
                        <option key={s.account_id} value={s.account_id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                {assignStep === 1 ? (
                  <>
                    <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Hủy</button>
                    <button 
                      onClick={() => setAssignStep(2)} 
                      disabled={!selectedBranchId}
                      className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50"
                    >
                      Tiếp tục
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setAssignStep(1)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Quay lại</button>
                    <button 
                      onClick={submitAssign} 
                      disabled={!selectedBranchId || !selectedStaffId || isAssigning}
                      className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg disabled:opacity-50"
                    >
                      {isAssigning ? 'Đang phân công...' : 'Gửi yêu cầu'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Customer Management                       */
/* ─────────────────────────────────────────── */
export const CustomerManagement = () => {
  const { role } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rankFilter, setRankFilter] = useState('Tất cả');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await customerApi.getAllCustomers();
      if (res && res.success) {
        // Ánh xạ loyalty_points sang rank (Đồng bộ với loyaltyService.js)
        const mapped = res.data.map(c => {
           const pts = Number(c.loyalty_points) || 0;
           let rank = 'Mới';
           if (pts >= 3000) rank = 'Kim cương';
           else if (pts >= 1500) rank = 'Vàng';
           else if (pts >= 500) rank = 'Bạc';
           else if (pts >= 100) rank = 'Đồng';
           return { ...c, rank, loyalty_points: pts };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (window.confirm(`Bạn có chắc muốn ${currentStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      try {
        const res = await customerApi.updateStatus(id, !currentStatus);
        if (res && res.success) {
          fetchCustomers();
        } else {
          alert(res?.message || 'Có lỗi xảy ra');
        }
      } catch (err) {
        alert(err?.message || 'Lỗi kết nối');
      }
    }
  };

  const ranks = ['Tất cả', 'Mới', 'Đồng', 'Bạc', 'Vàng', 'Kim cương'];

  const filtered = customers.filter(c => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const cRank = c.rank || 'Mới'; 
    const matchRank = rankFilter === 'Tất cả' || cRank === rankFilter;
    return matchSearch && matchRank;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE_CUSTOMERS);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE_CUSTOMERS, page * PAGE_SIZE_CUSTOMERS);

  const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Khách hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">{customers.length} khách hàng · Tổng doanh thu: {(totalRevenue / 1000000).toFixed(1)}M đ</p>
      </div>

      {/* Rank Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ranks.filter(r => r !== 'Tất cả').map(rank => (
          <div key={rank} className={cn('rounded-xl border border-border p-3 text-center', rankColors[rank])}>
            <p className="text-xl font-black">{customers.filter(c => (c.rank || 'Mới') === rank).length}</p>
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
          {isLoading ? (
            <div className="col-span-full flex justify-center p-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : paginated.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Không tìm thấy khách hàng nào.</div>
          ) : paginated.map((customer, i) => (
            <motion.div
              key={customer.customer_id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-card border border-border p-5 hover:shadow-md hover:border-foreground/20 transition-all group relative"
            >
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
                {/* Nút Khóa / Mở khóa - CHỈ ADMIN mới thấy */}
                {role === 'admin' && (
                  <button 
                    onClick={() => handleToggleStatus(customer.customer_id, customer.is_active)}
                    className={cn('text-xs font-bold px-3 py-1 rounded-md transition-colors shadow-sm', 
                      customer.is_active ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    )}
                  >
                    {customer.is_active ? 'Khóa' : 'Mở khóa'}
                  </button>
                )}
                
                {/* Hạng thành viên (To và rõ ràng hơn) */}
                <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 shadow-sm border', 
                  customer.rank === 'Kim cương' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                  customer.rank === 'Vàng' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  customer.rank === 'Bạc' ? 'bg-slate-100 text-slate-800 border-slate-200' :
                  customer.rank === 'Đồng' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                )}>
                  {customer.rank || 'Mới'}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4 pr-16 relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/60 flex items-center justify-center text-foreground font-black text-lg flex-shrink-0">
                  {customer.full_name?.charAt(0) || 'K'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{customer.full_name || 'Khách vãng lai'}</h3>
                  <p className="text-xs text-muted-foreground">Tham gia {customer.created_at ? new Date(customer.created_at).toLocaleDateString('vi-VN') : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black">{customer.total_orders || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Đơn hàng</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-base font-black">{(Number(customer.total_spent || 0) / 1000000).toFixed(1)}M</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Đã chi</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors truncate">
                  <Mail size={11} className="flex-shrink-0" />{customer.email || 'Không có email'}
                </a>
                <div className="flex items-center gap-2">
                  <Phone size={11} className="flex-shrink-0" />{customer.phone || 'Chưa cập nhật'}
                </div>
                <div className="flex items-center gap-2 font-bold text-amber-500">
                  <Star size={11} className="flex-shrink-0" /> {customer.loyalty_points || 0} Điểm
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
