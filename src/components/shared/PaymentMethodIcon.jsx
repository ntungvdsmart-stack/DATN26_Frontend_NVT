import { Banknote } from 'lucide-react';

export default function PaymentMethodIcon({ method }) {
  const names = { cash: 'Tiền mặt', stripe: 'Stripe', vnpay: 'VNPAY', momo: 'MoMo' };
  return <span className="payment-method-icon shrink-0" role="img" aria-label={names[method]}>
    {method === 'cash' ? <Banknote size={27} strokeWidth={1.6} className="text-emerald-700" /> : method === 'momo' ? <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true"><rect width="48" height="48" rx="10" fill="#a50064" /><g fill="white" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="17" textAnchor="middle"><text x="24" y="22">mo</text><text x="24" y="38">mo</text></g></svg> : method === 'stripe' ? <svg viewBox="0 0 80 40" width="57" height="30" aria-hidden="true"><text x="40" y="29" textAnchor="middle" fill="#635bff" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="26" letterSpacing="-1.4">stripe</text></svg> : <svg viewBox="0 0 86 36" width="60" height="28" aria-hidden="true"><text x="5" y="25" fontFamily="Arial,sans-serif" fontSize="20" fontWeight="800"><tspan fill="#e7212d">VN</tspan><tspan fill="#07539b">PAY</tspan></text></svg>}
  </span>;
}
