import TableHeading from '../components/shared/TableHeading';
import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import ProductImage from '../components/shared/ProductImage';
import ModalLayer from '../components/shared/ModalLayer';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Edit2, Save, X, Loader2, AlertTriangle, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import inventoryApi from '../api/inventoryApi';
import { useAuth } from '../context/AuthContext';

const InventoryManagement = () => {
  const { can, role, user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Edit State
  const [editItem, setEditItem] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchInventory = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await inventoryApi.getInventory(selectedBranch);
      if (res && res.success) {
        setInventory(res.data.inventory);
        setBranches(res.data.branches);
      }
    } catch (error) {
      setLoadError(error.message || 'Không thể tải tồn kho');
    }
    setIsLoading(false);
  }, [selectedBranch]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (newQuantity === '' || !Number.isSafeInteger(Number(newQuantity)) || Number(newQuantity) < (receiving ? 1 : 0) || !reason.trim()) { toast.error('Nhập số lượng nguyên hợp lệ và lý do nhập/điều chỉnh'); return; }
    setIsSaving(true);
    try {
      const res = receiving ? await inventoryApi.receiveStock(editItem, Number(newQuantity), reason.trim()) : await inventoryApi.updateQuantity(editItem.inventory_id, Number(newQuantity), reason.trim(), editItem.quantity, editItem);
      if (res && res.success) {
        toast.success('Đã cập nhật tồn kho');
        setEditItem(null);
        fetchInventory();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Lỗi hệ thống');
    }
    setIsSaving(false);
  };

  const filteredInventory = inventory.filter(i => 
    i.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedInventory = useMemo(() => {
    const map = new Map();
    filteredInventory.forEach(item => {
      const pId = item.product_id;
      if (!map.has(pId)) {
        map.set(pId, {
          product_id: pId,
          product_name: item.product_name,
          image: item.image,
          totalQuantity: 0,
          variants: []
        });
      }
      const group = map.get(pId);
      group.totalQuantity += Number(item.quantity);
      group.variants.push(item);
    });
    return Array.from(map.values());
  }, [filteredInventory]);

  const toggleExpand = (pId) => {
    const newSet = new Set(expandedProducts);
    if (newSet.has(pId)) newSet.delete(pId);
    else newSet.add(pId);
    setExpandedProducts(newSet);
  };

  const listPage = useListPagination(groupedInventory, searchTerm + '|' + selectedBranch);

  return (
    <div className="p-1 sm:p-4 space-y-6 min-h-screen bg-background/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Quản lý Tồn kho
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Theo dõi số lượng hàng hóa tại các chi nhánh</p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Tìm tên sản phẩm hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={role === 'staff' ? user.branch_id || '' : selectedBranch}
            disabled={role === 'staff'}
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary outline-none"
          >
            {role === 'admin' && <option value="">Tất cả chi nhánh</option>}
            {branches.map(b => (
              <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{loadError} <button onClick={fetchInventory} className="underline ml-3">Thử lại</button></div>}
      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <TableHeading title={"T\u1ed3n kho theo s\u1ea3n ph\u1ea9m"} count={groupedInventory.length} loading={isLoading} />
        <div className="admin-table-scroll overflow-x-auto">
          <table className="admin-data-table table-with-actions w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground w-1/2">Sản phẩm</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground">Tổng Tồn Kho</th>
                <th className="p-4 font-bold text-sm uppercase text-muted-foreground text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : groupedInventory.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-12 text-center text-muted-foreground font-medium">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                listPage.items.map((group) => (
                  <React.Fragment key={group.product_id}>
                    {/* Header Row cho 1 Sản phẩm */}
                    <tr 
                      onClick={() => toggleExpand(group.product_id)}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <ProductImage src={group.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted border border-border/50 shadow-sm" />
                          <div>
                            <p className="font-bold text-foreground text-sm uppercase tracking-wide">{group.product_name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{group.variants.length} biến thể</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-base">{group.totalQuantity}</span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                          {expandedProducts.has(group.product_id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Danh sách biến thể (Expanded) */}
                    <AnimatePresence>
                      {expandedProducts.has(group.product_id) && group.variants.map(item => (
                        <motion.tr 
                          key={`${item.variant_id}-${item.branch_id}`} 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-muted/10 border-b border-border/20 hover:bg-muted/20 transition-colors text-sm"
                        >
                          <td className="p-4 pl-16">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-foreground">
                                {item.color_name} {item.size_value ? `- ${item.size_value}` : ''}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono bg-background/50 px-1.5 py-0.5 rounded w-fit border border-border/50">
                                {item.sku}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              {item.quantity <= 5 ? (
                                <span className="flex items-center gap-1 text-red-500 font-bold bg-red-500/10 w-fit px-2 py-0.5 rounded-md text-xs">
                                  <AlertTriangle size={14} /> {item.quantity} (Sắp hết)
                                </span>
                              ) : (
                                <span className="font-bold pl-1">{item.quantity}</span>
                              )}
                              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <MapPin size={12} /> {item.branch_name}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right align-middle">
                            {can('inventory.manage') && (role === 'admin' || Number(user.branch_id) === Number(item.branch_id)) && <><button onClick={() => { setReceiving(true); setEditItem(item); setNewQuantity(''); setReason(''); }} className="px-3 py-2 mr-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Nhập hàng</button><button
                              onClick={() => { setReceiving(false); setEditItem(item); setNewQuantity(item.quantity); setReason(''); }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 bg-background/50"
                              title="Cập nhật tồn kho"
                            >
                              <Edit2 size={16} />
                            </button></>}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && <div className="admin-table-footer"><Pagination {...listPage.paginationProps} /></div>}
      </div> 

      <AnimatePresence>
        {editItem && (
          <ModalLayer onClose={() => setEditItem(null)} label="Nhập và điều chỉnh kho"><div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditItem(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl overflow-hidden p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{receiving ? 'Nhập hàng vào chi nhánh' : 'Cập nhật tồn kho'}</h2>
                <button onClick={() => setEditItem(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full"><X size={18} /></button>
              </div>
              
              <div className="mb-4">
                <p className="font-bold text-sm">{editItem.product_name}</p>
                <p className="text-xs text-muted-foreground">{editItem.sku} • {editItem.branch_name}</p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground">{receiving ? 'Số lượng nhập thêm *' : 'Số lượng mới *'}</label>
                  <input type="number" min={receiving ? 1 : 0} step="1" max="2147483647" required value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="w-full px-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary" />
                  {receiving && <p className="text-xs text-muted-foreground">Hiện có: {editItem.quantity}. Số lượng nhập sẽ được cộng vào kho hiện tại.</p>}
                </div>
                <label className="block text-sm font-medium">Lý do điều chỉnh *
                  <textarea required maxLength={300} value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background p-3" placeholder="Kiểm kê thực tế, hàng hỏng..." />
                </label>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditItem(null)} className="px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted rounded-lg text-sm">Hủy</button>
                  <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 text-sm">
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu
                  </button>
                </div>
              </form>
            </motion.div>
          </div></ModalLayer>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryManagement;
