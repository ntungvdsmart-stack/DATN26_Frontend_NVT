import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export function useOrderQuote({ items, customerId, channel, promotionId, enabled = true }) {
  const payload = JSON.stringify({ items, customer_id: customerId || null, channel, promotion_id: promotionId || null });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled || !JSON.parse(payload).items.length) {
      setQuote(prev => (prev === null ? prev : null));
      setError(prev => (prev === '' ? prev : ''));
      setLoading(prev => (!prev ? prev : false));
      return;
    }
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      axiosClient.post('/orders/quote', JSON.parse(payload), { signal: controller.signal })
        .then(result => { if (active) setQuote(result.data); })
        .catch(err => { if (active) { setQuote(null); setError(err.message); } })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [payload, enabled]);
  return { quote, loading, error };
}
