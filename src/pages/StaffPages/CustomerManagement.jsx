import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Lock, Unlock, Eye, Star, Phone, Mail, UserPlus, X, ShoppingBag, ShieldAlert } from 'lucide-react';
import customerApi from '../../api/customerApi';
import moment from 'moment';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form thêm khách hàng
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', email: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAllCustomers();
      if (res && res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleViewCustomer = async (id) => {
    try {
      const res = await customerApi.getCustomerById(id);
      if (res && res.success) {
        setSelectedCustomer(res.data);
      }
    } catch (err) {
      alert('Lỗi tải thông tin khách hàng');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus ? 0 : 1;
    const confirmMsg = newStatus === 0 
      ? 'Bạn có chắc chắn muốn KHÓA tài khoản này? Khách hàng sẽ không thể đăng nhập.'
      : 'Bạn muốn MỞ KHÓA tài khoản này?';
    
    if (!window.confirm(confirmMsg)) return;
    
    setIsUpdating(true);
    try {
      const res = await customerApi.updateStatus(id, newStatus);
      if (res && res.success) {
        alert('Cập nhật trạng thái thành công');
        fetchCustomers();
        if (selectedCustomer && selectedCustomer.customer_id === id) {
          setSelectedCustomer({...selectedCustomer, is_active: newStatus});
        }
      } else {
        alert(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.message || 'Lỗi kết nối');
    }
    setIsUpdating(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await customerApi.createCustomer(newCustomer);
      if (res && res.success) {
        alert('Thêm khách hàng thành công!');
        setIsAdding(false);
        setNewCustomer({ full_name: '', phone: '', email: '' });
        fetchCustomers();
      } else {
        alert(res?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err.message || 'Lỗi kết nối');
    }
    setIsUpdating(false);
  };

  const filteredCustomers = customers.filter(c => {
    const search = searchTerm.toLowerCase();
    return c.full_name.toLowerCase().includes(search) || 
           c.email.toLowerCase().includes(search) || 
           (c.phone && c.phone.includes(search));
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><User className="w-8 h-8 text-primary"/> Khách Hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">Hồ sơ CRM, quản lý lịch sử mua hàng và trạng thái tài khoản</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <UserPlus className="w-5 h-5" /> Thêm Khách Hàng
        </button>
      </div>

      {/* Search & List */}
      <div className="glass-panel rounded-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" placeholder="Tìm theo tên, email, số điện thoại..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold text-muted-foreground">Khách Hàng</th>
                <th className="px-4 py-3 font-bold text-muted-foreground">Liên Hệ</th>
                <th className="px-4 py-3 font-bold text-muted-foreground text-center">Số Đơn</th>
                <th className="px-4 py-3 font-bold text-muted-foreground text-right">Tổng Chi Tiêu</th>
                <th className="px-4 py-3 font-bold text-muted-foreground text-center">Trạng Thái</th>
                <th className="px-4 py-3 font-bold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10">Đang tải dữ liệu...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-10 text-muted-foreground">Không có dữ liệu.</td></tr>
              ) : (
                filteredCustomers.map(c => {
                  const isVIP = c.total_spent >= 5000000; // Tiêu > 5 triệu là VIP
                  return (
                    <tr key={c.customer_id} className={`transition-colors ${c.is_active ? 'hover:bg-muted/20' : 'bg-red-500/5 opacity-75 grayscale'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary shrink-0 relative">
                            {c.full_name.charAt(0).toUpperCase()}
                            {isVIP && <Star className="w-4 h-4 text-yellow-500 absolute -bottom-1 -right-1 fill-yellow-500 drop-shadow-md" />}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              {c.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                              {c.customer_type === 'pos' ? <span className="text-indigo-500 font-bold">Tại quầy</span> : 'Online'}
                              {isVIP && <span className="text-yellow-500 font-bold text-[10px] ml-1 bg-yellow-500/10 px-1 rounded">VIP</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs"><Mail className="w-3.5 h-3.5 text-muted-foreground"/> {c.email}</div>
                        {c.phone && <div className="flex items-center gap-1.5 text-xs"><Phone className="w-3.5 h-3.5 text-muted-foreground"/> {c.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-primary">
                        {c.total_orders}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(c.total_spent)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.is_active ? (
                          <span className="bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-1 rounded-md text-[11px] font-bold">Hoạt động</span>
                        ) : (
                          <span className="bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max mx-auto"><ShieldAlert className="w-3 h-3"/> Đã Khóa</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleViewCustomer(c.customer_id)} className="p-2 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleStatus(c.customer_id, c.is_active)} className={`p-2 rounded-lg transition-colors text-white ${c.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`} title={c.is_active ? "Khóa tài khoản" : "Mở khóa"}>
                            {c.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Chi tiết Khách hàng */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="w-full max-w-lg bg-background h-full shadow-2xl flex flex-col border-l border-border"
            >
              <div className="p-6 border-b border-border bg-gradient-to-br from-primary/10 to-transparent flex justify-between items-start shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-background border-2 border-primary shadow-lg flex items-center justify-center text-3xl font-black text-primary">
                      {selectedCustomer.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{selectedCustomer.full_name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">Tham gia: {moment(selectedCustomer.created_at).format('DD/MM/YYYY')}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-background/50 rounded-full relative z-10"><X className="w-5 h-5"/></button>
                {selectedCustomer.total_spent >= 5000000 && <Star className="absolute -bottom-10 -right-10 w-48 h-48 text-yellow-500/10 fill-yellow-500/10 rotate-12 pointer-events-none" />}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tổng Số Đơn</div>
                    <div className="text-3xl font-black text-primary">{selectedCustomer.total_orders}</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tổng Chi Tiêu</div>
                    <div className="text-2xl font-black text-primary mt-2">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(selectedCustomer.total_spent)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2"><User className="w-4 h-4 text-primary"/> Thông tin liên hệ</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground"/> {selectedCustomer.email}</div>
                    <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-muted-foreground"/> {selectedCustomer.phone || 'Chưa cập nhật'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 border-b border-border pb-2"><ShoppingBag className="w-4 h-4 text-primary"/> Đơn hàng gần đây ({selectedCustomer.recent_orders?.length || 0})</h3>
                  <div className="space-y-3">
                    {selectedCustomer.recent_orders?.map(order => (
                      <div key={order.order_id} className="p-3 border border-border rounded-xl bg-background hover:border-primary/50 transition-colors flex justify-between items-center">
                        <div>
                          <div className="font-bold font-mono text-sm">{order.order_code}</div>
                          <div className="text-xs text-muted-foreground mt-1">{moment(order.created_at).format('DD/MM/YYYY HH:mm')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND'}).format(order.total_amount)}</div>
                          <div className="text-[10px] uppercase font-bold mt-1 text-muted-foreground">{order.order_status}</div>
                        </div>
                      </div>
                    ))}
                    {(!selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0) && (
                      <div className="text-center p-4 text-muted-foreground text-sm bg-muted/20 rounded-xl">Chưa có đơn hàng nào</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Thêm Khách hàng */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-background w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="font-black text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary"/> Thêm Khách Hàng</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Họ và tên *</label>
                  <input type="text" required value={newCustomer.full_name} onChange={e=>setNewCustomer({...newCustomer, full_name: e.target.value})} className="w-full p-2.5 bg-background border border-border rounded-xl focus:border-primary outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Số điện thoại</label>
                  <input type="tel" value={newCustomer.phone} onChange={e=>setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full p-2.5 bg-background border border-border rounded-xl focus:border-primary outline-none" placeholder="0987654321" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email *</label>
                  <input type="email" required value={newCustomer.email} onChange={e=>setNewCustomer({...newCustomer, email: e.target.value})} className="w-full p-2.5 bg-background border border-border rounded-xl focus:border-primary outline-none" placeholder="email@example.com" />
                </div>
                
                <div className="pt-4 border-t border-border flex gap-3">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2.5 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/80 transition-colors">Hủy</button>
                  <button type="submit" disabled={isUpdating} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-primary hover:opacity-90 transition-opacity">Tạo Khách Hàng</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerManagement;
