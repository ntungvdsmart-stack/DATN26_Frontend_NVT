import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Search, ArrowRight, AlertCircle } from 'lucide-react';
import faqApi from '../api/faqApi';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    faqApi.getActive().then(res => { if (active) { if (!res?.success) throw new Error('Không tải được câu hỏi'); setFaqs(res.data || []); } })
      .catch(() => { if (active) setError('Không tải được câu hỏi. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const filtered = faqs.filter(faq => normalize(`${faq.question} ${faq.answer}`).includes(normalize(search.trim())));
  const listPage = useListPagination(filtered, search);
  return <div className="customer-page"><main className="customer-container max-w-4xl space-y-7">
    <header className="text-center max-w-xl mx-auto pt-2 sm:pt-5"><span className="customer-empty-icon mx-auto mb-5"><HelpCircle size={28} strokeWidth={1.5} /></span><p className="customer-eyebrow">TRUNG TÂM HỖ TRỢ</p><h1 className="customer-title">Bạn cần giúp gì?</h1><p className="customer-description">Tìm câu trả lời về mua sắm, thanh toán, giao hàng và đổi trả tại FashionOS.</p></header>
    <label className="relative block max-w-xl mx-auto"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input aria-label="Tìm câu hỏi" value={search} maxLength={200} onChange={event => { setSearch(event.target.value); setOpenId(null); }} placeholder="Tìm câu hỏi, ví dụ: giao hàng, đổi trả..." className="customer-input w-full pl-12 shadow-sm" /></label>
    {loading ? <div role="status" className="space-y-3"><span className="sr-only">Đang tải câu hỏi</span>{[1,2,3,4].map(id => <div key={id} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div> : error ? <div role="alert" className="customer-surface customer-empty"><AlertCircle size={28} className="text-destructive" /><p>{error}</p><button className="customer-secondary" onClick={() => { setLoading(true); setError(''); setReload(value => value + 1); }}>Thử lại</button></div> : <>
      <div className="flex justify-between items-center text-xs text-muted-foreground"><span>Câu hỏi thường gặp</span><span>{filtered.length} câu hỏi</span></div>
      <div className="space-y-3">{listPage.items.map(faq => {
        const open = openId === faq.faq_id;
        return <article key={faq.faq_id} className={`customer-surface overflow-hidden ${open ? 'border-foreground/25' : ''}`}><h2><button aria-expanded={open} aria-controls={`faq-answer-${faq.faq_id}`} onClick={() => setOpenId(open ? null : faq.faq_id)} className="flex items-center justify-between gap-4 w-full p-5 sm:p-6 text-left"><span className="font-semibold text-sm sm:text-base leading-relaxed break-words min-w-0">{faq.question}</span><ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} /></button></h2><AnimatePresence initial={false}>{open && <motion.div id={`faq-answer-${faq.faq_id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .2 }}><p className="px-5 sm:px-6 pb-6 text-sm text-muted-foreground leading-7 whitespace-pre-line break-words">{faq.answer}</p></motion.div>}</AnimatePresence></article>;
      })}</div>
      {!filtered.length && <div className="customer-surface customer-empty"><Search size={30} className="text-muted-foreground" /><h2>{search ? 'Chưa tìm thấy câu trả lời' : 'Chưa có câu hỏi được đăng'}</h2><p>Thử từ khóa khác hoặc mở chat để được shop hỗ trợ.</p>{search && <button onClick={() => setSearch('')} className="customer-secondary">Xóa tìm kiếm</button>}</div>}
      {listPage.paginationProps.totalPages > 1 && <Pagination {...listPage.paginationProps} />}
    </>}
    <aside className="customer-surface flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 sm:p-6"><div><h2 className="font-semibold">Bạn muốn kiểm tra đơn mua?</h2><p className="text-sm text-muted-foreground mt-1">Xem tiến độ và thông tin đơn hàng trong tài khoản.</p></div><Link to="/store/orders" className="customer-secondary shrink-0">Đơn hàng của tôi<ArrowRight size={16} /></Link></aside>
  </main></div>;
}
