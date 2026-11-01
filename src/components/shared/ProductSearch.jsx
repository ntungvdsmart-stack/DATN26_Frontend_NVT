import ProductImage from './ProductImage';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import productApi from '../../api/productApi';

export default function ProductSearch({ onNavigate }) {
  const navigate = useNavigate();
  const id = useId();
  const root = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ products: [], keywords: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(-1);
  const options = [
    ...data.keywords.map(keyword => ({ label: keyword, to: `/store/products?search=${encodeURIComponent(keyword)}` })),
    ...data.products.map(product => ({ label: product.product_name, to: `/store/products/${product.product_id}`, product })),
  ];
  const go = to => { setOpen(false); setQuery(''); navigate(to); onNavigate?.(); };
  useEffect(() => {
    if (active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id]);
  useEffect(() => {
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData({ products: [], keywords: [] }); setActive(-1); setError(false);
    if (!query.trim() || !open) { setLoading(false); return () => controller.abort(); }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await productApi.getSearchSuggestions(query.trim(), controller.signal);
        if (!controller.signal.aborted) setData(res.data || { products: [], keywords: [] });
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open]);
  const expanded = open && !!query.trim();
  return (
    <div ref={root} className="relative w-full min-w-0" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <form className="flex items-center gap-2 rounded-full border border-border bg-background px-3" onSubmit={event => {
        event.preventDefault(); if (query.trim()) go(`/store/products?search=${encodeURIComponent(query.trim())}`);
      }}>
        <button type="submit" aria-label="Tìm kiếm" className="shrink-0 p-2"><Search size={18} /></button>
        <input role="combobox" aria-label="Tìm kiếm sản phẩm" aria-autocomplete="list" aria-expanded={expanded} aria-controls={id}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          autoComplete="off" maxLength={100} value={query} placeholder="Tìm sản phẩm, danh mục..."
          onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault(); setOpen(true);
              if (options.length) setActive(index => event.key === 'ArrowDown' ? (index + 1) % options.length : (index <= 0 ? options.length - 1 : index - 1));
            }
            if (event.key === 'Enter' && expanded && active >= 0 && options[active]) { event.preventDefault(); go(options[active].to); }
          }} className="w-full min-w-0 bg-transparent py-3 text-sm outline-none" />
        {query && <button type="button" aria-label="Xóa từ khóa" onClick={() => { setQuery(''); root.current.querySelector('input')?.focus(); }} className="shrink-0 p-2"><X size={16} /></button>}
      </form>
      {expanded && <div className="absolute top-full left-0 right-0 mt-2 max-h-[min(60dvh,26rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background shadow-xl z-[60]">
        <div role="status" className="px-4 py-2 text-xs text-muted-foreground">
          {loading ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Đang tìm...</span> : error ? 'Chưa tải được gợi ý. Nhấn Enter để tìm kiếm.' : options.length ? 'Gợi ý theo danh mục, thương hiệu và sản phẩm' : 'Chưa có gợi ý phù hợp. Thử từ khóa khác.'}
        </div>
        <ul id={id} role="listbox" aria-label="Gợi ý tìm kiếm">
          {options.map((option, index) => <li key={`${option.to}-${index}`} id={`${id}-${index}`} role="option" aria-selected={active === index}>
            <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => go(option.to)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left ${active === index ? 'bg-muted' : 'hover:bg-muted'}`}>
              {option.product ? <ProductImage loading="lazy" src={option.product.primary_image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" /> : <Search size={16} className="shrink-0" />}
              <span className="min-w-0 break-words text-sm">{option.label}{option.product && <span className="block text-xs text-muted-foreground">{Number(option.product.base_price).toLocaleString('vi-VN')}đ</span>}</span>
            </button>
          </li>)}
        </ul>
        <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => go(`/store/products?search=${encodeURIComponent(query.trim())}`)} className="w-full border-t border-border px-4 py-3 text-left text-sm font-bold break-words">Tìm “{query.trim()}” →</button>
      </div>}
    </div>
  );
}
