import React from 'react';

export default function Pagination({ page, totalPages, onChange, totalItems, pageSize, onPageSizeChange, label = 'Phân trang', disabled = false }) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(total, Math.max(1, Number(page) || 1));
  const pages = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => current - 2 + index).filter(value => value > 1 && value < total), total])].sort((a,b) => a-b);
  return <nav aria-label={label} className="pagination flex flex-wrap items-center justify-center gap-2 mt-6">
    {Number.isFinite(totalItems) && <span className="pagination-summary text-xs text-muted-foreground">{totalItems === 0 ? 'Không có dữ liệu' : Number.isFinite(pageSize) ? `Hiển thị ${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, totalItems)} / ${totalItems} bản ghi` : `${totalItems} bản ghi`}</span>}
    {onPageSizeChange && totalItems !== 0 && <label className="flex items-center gap-2 text-sm">Mỗi trang<select aria-label={`${label}: số dòng mỗi trang`} disabled={disabled} value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} className="rounded-lg border border-border bg-background px-2 py-2">{[10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>}
    {total > 1 && <>
    <button type="button" disabled={disabled || current === 1} onClick={() => onChange(current - 1)} className="border border-border rounded-xl px-3 py-2 disabled:opacity-40">Trước</button>
    {pages.map((value, index) => <React.Fragment key={value}>{index > 0 && value > pages[index-1]+1 && <span aria-hidden="true">…</span>}<button type="button" disabled={disabled} aria-label={`Trang ${value}`} aria-current={value === current ? 'page' : undefined} onClick={() => onChange(value)} className={`rounded-xl px-3 py-2 border border-border ${value === current ? 'bg-primary text-primary-foreground' : ''}`}>{value}</button></React.Fragment>)}
    <button type="button" disabled={disabled || current >= total} onClick={() => onChange(current + 1)} className="border border-border rounded-xl px-3 py-2 disabled:opacity-40">Sau</button>
    </>}
  </nav>;
}
