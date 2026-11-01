import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import orderApi from '../../api/orderApi';

const labels = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', completed: 'Hoàn thành', cancelled: 'Đã hủy', returned: 'Đã trả hàng' };
export default function OperationsOverview() {
  const [data, setData] = useState({ orders: [], activity: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    let active = true;
    Promise.allSettled([orderApi.getAllOrders({ limit: 5 }), axiosClient.get('/activity-logs', { params: { limit: 5 } })]).then(results => {
      if (!active) return;
      const [orders, activity] = results;
      setData({ orders: orders.status === 'fulfilled' ? orders.value.data.items || [] : [], activity: activity.status === 'fulfilled' ? activity.value.data.items.slice(0, 5) : [] });
      setErrors({ orders: orders.status === 'rejected', activity: activity.status === 'rejected' });
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const empty = (key, message) => <p role={errors[key] ? 'alert' : 'status'} className={`text-sm py-6 text-center ${errors[key] ? 'text-destructive' : 'text-muted-foreground'}`}>{loading ? 'Đang tải...' : errors[key] ? 'Không tải được dữ liệu. Vui lòng tải lại trang.' : message}</p>;
  return <section className="space-y-5"><h2 className="text-lg font-semibold">Theo dõi vận hành</h2>
    <div className="admin-table-panel"><div className="admin-table-toolbar"><h3 className="font-semibold text-sm">Đơn hàng gần đây</h3><Link to="/orders" className="text-xs inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">Xem tất cả<ArrowRight size={14} /></Link></div><div className="overflow-x-auto"><table className="admin-data-table w-full text-left"><thead><tr>{['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{data.orders.map(order => <tr key={order.order_id}><td><Link className="font-medium hover:underline" to="/orders">{order.order_code}</Link></td><td>{order.customer_name || 'Khách vãng lai'}</td><td>{Number(order.total_amount).toLocaleString('vi-VN')}đ</td><td><span className="table-neutral-badge">{labels[order.order_status] || order.order_status}</span></td></tr>)}{!data.orders.length && <tr><td colSpan={4}>{empty('orders', 'Chưa có đơn hàng')}</td></tr>}</tbody></table></div></div>
    <div><article className="customer-surface p-5"><div className="flex justify-between gap-2 mb-4"><h3 className="font-semibold text-sm">Hoạt động gần đây</h3><Link to="/admin/logs" className="text-xs text-muted-foreground hover:underline">Xem nhật ký</Link></div><div className="space-y-4">{data.activity.map(item => <div key={item.log_id} className="border-l-2 border-border pl-3"><p className="text-xs leading-6 break-words">{item.description || item.action}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(item.created_at).toLocaleString('vi-VN')}</p></div>)}</div>{!data.activity.length && empty('activity', 'Chưa có hoạt động')}</article>
</div>
  </section>;
}
