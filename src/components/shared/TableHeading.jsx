import { Table2 } from 'lucide-react';

export default function TableHeading({ title, count, loading = false, hint }) {
  return <div className="table-heading"><div className="flex items-center gap-3 min-w-0"><span className="table-record-icon"><Table2 size={17} strokeWidth={1.6} /></span><div className="min-w-0"><h2 className="font-semibold text-sm">{title}</h2>{hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}</div></div><span className="table-count-badge" aria-live="polite">{loading ? 'Đang tải...' : `${Number(count || 0).toLocaleString('vi-VN')} bản ghi`}</span></div>;
}
