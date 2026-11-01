import { useEffect, useLayoutEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function VietmapAutocomplete({ value, onChange, placeholder = 'Nhập địa chỉ của bạn...', className = '', required = false }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const wrapper = useRef(null), popup = useRef(null), currentQuery = useRef(query), selection = useRef(0);
  const listId = useId();
  const api = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  useEffect(() => {
    if ((value || '') !== currentQuery.current) { selection.current++; currentQuery.current = value || ''; setQuery(value || ''); }
  }, [value]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (query.trim().length < 3) { setSuggestions([]); setLoading(false); return; }
      setLoading(true);
      try {
        const result = await axios.get(`${api}/vietmap/autocomplete`, { params: { text: query }, signal: controller.signal, timeout: 8000 });
        if (!controller.signal.aborted) { const data = result.data?.data; setSuggestions(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []); setError(''); setActive(-1); }
      } catch { if (!controller.signal.aborted) { setSuggestions([]); setError('Chưa tải được gợi ý. Bạn vẫn có thể nhập địa chỉ đầy đủ.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, api]);
  useLayoutEffect(() => {
    if (!open || !suggestions.length) return;
    const place = () => {
      const rect = wrapper.current.getBoundingClientRect();
      const height = window.visualViewport?.height || innerHeight;
      const below = height - rect.bottom - 12;
      const above = below < 150 && rect.top > below;
      const maxHeight = Math.max(80, Math.min(260, above ? rect.top - 12 : below));
      setPosition({ position: 'fixed', left: Math.max(8, rect.left), width: Math.min(rect.width, innerWidth - 16), maxHeight, ...(above ? { bottom: innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) });
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true); window.visualViewport?.addEventListener('resize', place);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); window.visualViewport?.removeEventListener('resize', place); };
  }, [open, suggestions.length]);
  useEffect(() => {
    const outside = event => { if (!wrapper.current?.contains(event.target) && !popup.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => { selection.current++; document.removeEventListener('pointerdown', outside); };
  }, []);
  const choose = async item => {
    const text = item.display || item.address || item.name || '';
    const request = ++selection.current;
    currentQuery.current = text; setQuery(text); setOpen(false); onChange(text, null, null);
    if (!item.ref_id) return;
    try {
      const result = await axios.get(`${api}/vietmap/place`, { params: { ref_id: item.ref_id }, timeout: 8000 });
      if (selection.current === request) { const place = result.data?.data; onChange(text, place?.lat ?? null, place?.lng ?? null); setError(''); }
    } catch { if (selection.current === request) setError('Đã chọn địa chỉ nhưng chưa lấy được tọa độ. Hệ thống sẽ thử xác định vị trí khi phân đơn.'); }
  };
  const visible = open && suggestions.length > 0;
  return <div ref={wrapper} className="relative w-full min-w-0">
    <div className="relative"><MapPin size={18} className="absolute left-3 top-3 text-muted-foreground" />
      <input required={required} role="combobox" aria-label="Địa chỉ đầy đủ" aria-expanded={visible} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 && visible ? `${listId}-${active}` : undefined} autoComplete="off" maxLength={255} value={query} placeholder={placeholder}
        onChange={event => { selection.current++; currentQuery.current = event.target.value; setQuery(event.target.value); setOpen(true); setActive(-1); setError(''); onChange(event.target.value, null, null); }}
        onFocus={() => setOpen(true)}
        onKeyDown={event => {
          if (event.key === 'Escape' && visible) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
          if (visible && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length); }
          if (visible && event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(suggestions[active]); }
        }} className={`w-full pl-10 pr-9 py-2.5 border border-border rounded-xl bg-background outline-none ${className}`} />
      {loading && <Loader2 size={16} className="absolute right-3 top-3 animate-spin" />}
    </div>
    {error && <p className="mt-1 text-xs text-muted-foreground" role="status">{error}</p>}
    {visible && position && createPortal(<ul ref={popup} id={listId} role="listbox" aria-label="Gợi ý địa chỉ" style={position} className="z-[11000] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background shadow-xl">
      {suggestions.map((item, index) => <li id={`${listId}-${index}`} key={item.ref_id || index} role="option" aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => choose(item)} className={`px-3 py-3 min-h-11 cursor-pointer border-b border-border last:border-0 break-words ${active === index ? 'bg-muted' : 'hover:bg-muted'}`}><span className="block font-medium text-sm">{item.name || item.display}</span><span className="block text-xs text-muted-foreground mt-1">{item.display || item.address}</span></li>)}
    </ul>, document.body)}
  </div>;
}
