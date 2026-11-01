import { Check, Package, CheckCircle2, Truck, ShoppingBag } from 'lucide-react';

const steps = [
  { key: 'pending', label: 'Chờ xác nhận', icon: ShoppingBag },
  { key: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle2 },
  { key: 'processing', label: 'Chuẩn bị hàng', icon: Package },
  { key: 'shipping', label: 'Đang giao', icon: Truck },
  { key: 'completed', label: 'Hoàn thành', icon: CheckCircle2 }
];
export default function OrderProgress({ status }) {
  const current = steps.findIndex(step => step.key === status);
  return <ol aria-label="Tiến độ đơn hàng" className="order-progress">
    {steps.map(({ key, label, icon: Icon }, index) => <li key={key} aria-current={current === index ? 'step' : undefined} className={`order-progress-step ${index < current ? 'is-complete' : ''} ${index === current ? 'is-current' : ''}`}>
      <span className="order-progress-icon">{index < current ? <Check size={18} /> : <Icon size={18} strokeWidth={1.7} />}</span>
      <span className="order-progress-label">{label}<span className="order-progress-hint">{index < current ? 'Đã qua bước này' : index === current ? 'Trạng thái hiện tại' : 'Chưa đến bước này'}</span></span>
    </li>)}
  </ol>;
}
