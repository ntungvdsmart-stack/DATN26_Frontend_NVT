import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Search, Eye, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import returnApi from '../api/returnApi';
import { toast } from 'sonner';

const ReturnManagement = () => {
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await returnApi.getAll();
      if (res && res.success) {
        setReturns(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách yêu cầu');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm('Xác nhận cập nhật trạng thái này?')) return;
    try {
      await returnApi.updateStatus(id, status);
      toast.success('Cập nhật trạng thái thành công');
      setSelectedReturn(null);
      fetchReturns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-600">Đang chờ duyệt</span>;
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">Đã chấp nhận</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500">Đã từ chối</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">Đã hoàn tất (Đã nhận hàng)</span>;
      default: return null;
    }
  };

  const filteredReturns = returns.filter(r => 
    r.order_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-8 min-h-screen bg-background/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <RefreshCcw className="w-8 h-8 text-primary" />
            Yêu cầu Đổi/Trả hàng
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Quản lý và xử lý yêu cầu đổi trả, hoàn tiền</p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Mã đơn</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Khách hàng</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Loại & Lý do</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Ngày yêu cầu</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Trạng thái</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted-foreground">Không có yêu cầu đổi trả nào</td>
                </tr>
              ) : (
                filteredReturns.map((item) => (
                  <tr key={item.return_id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{item.order_code}</td>
                    <td className="p-4">
                      <p className="font-bold">{item.customer_name || 'Khách vãng lai'}</p>
                      <p className="text-xs text-muted-foreground">{item.customer_phone}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-bold uppercase text-[10px] bg-muted px-2 py-1 rounded">{item.return_type === 'return' ? 'Trả hàng' : 'Đổi hàng'}</span>
                      <p className="text-sm mt-1">{item.reason}</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4">{getStatusBadge(item.status)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedReturn(item)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors inline-block">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReturn(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Chi tiết yêu cầu {selectedReturn.return_type === 'return' ? 'Trả hàng' : 'Đổi hàng'}
                  {getStatusBadge(selectedReturn.status)}
                </h2>
                <button type="button" onClick={() => setSelectedReturn(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full"><XCircle size={20} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Mã đơn hàng</p>
                    <p className="font-mono font-bold text-lg">{selectedReturn.order_code}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground uppercase text-[10px] font-bold">Lý do</p>
                    <p className="font-medium text-destructive">{selectedReturn.reason}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground uppercase text-[10px] font-bold mb-3">Sản phẩm yêu cầu</p>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="p-3 font-bold">Sản phẩm</th>
                          <th className="p-3 font-bold text-center">Phân loại</th>
                          <th className="p-3 font-bold text-center">SL</th>
                          <th className="p-3 font-bold text-right">Giá trị trả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedReturn.items.map(item => (
                          <tr key={item.return_item_id}>
                            <td className="p-3 font-medium">{item.product_name}</td>
                            <td className="p-3 text-center text-muted-foreground">Size {item.size} - {item.color}</td>
                            <td className="p-3 text-center font-bold text-red-500">{item.quantity}</td>
                            <td className="p-3 text-right font-bold">{(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/20">
                        <tr>
                          <td colSpan="3" className="p-3 text-right font-bold text-muted-foreground uppercase text-xs">Tổng hoàn tiền (Dự kiến):</td>
                          <td className="p-3 text-right font-black text-lg text-emerald-600">
                            {selectedReturn.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {selectedReturn.return_type === 'return' && (
                    <p className="text-xs text-muted-foreground mt-2 italic">* Số tiền này sẽ được lưu vào danh sách Hoàn tiền (Refunds) chờ Kế toán xử lý khi trạng thái chuyển sang Đã nhận lại hàng.</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border/50 bg-muted/30 flex justify-between items-center mt-auto">
                <button type="button" onClick={() => setSelectedReturn(null)} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-lg">Đóng</button>
                
                <div className="flex gap-3">
                  {selectedReturn.status === 'requested' && (
                    <>
                      <button onClick={() => handleUpdateStatus(selectedReturn.return_id, 'rejected')} className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-bold hover:bg-destructive hover:text-white transition-colors flex items-center gap-2">
                        <XCircle size={18} /> Từ chối
                      </button>
                      <button onClick={() => handleUpdateStatus(selectedReturn.return_id, 'approved')} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center gap-2">
                        <CheckCircle size={18} /> Chấp nhận Y/C
                      </button>
                    </>
                  )}
                  {selectedReturn.status === 'approved' && (
                    <button onClick={() => handleUpdateStatus(selectedReturn.return_id, 'completed')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                      <RotateCcw size={18} /> Đã nhận lại hàng (Hoàn tiền & Nhập kho)
                    </button>
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

export default ReturnManagement;
