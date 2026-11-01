import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function ActivityLogs() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    axiosClient.get('/activity-logs', { params: { page, search: query } })
      .then(result => { if (active) { setData(result.data); const last = Math.max(1, Math.ceil(result.data.total / result.data.limit)); if (page > last) setPage(last); } })
      .catch(err => { if (active) setError(err.message || 'Không thể tải nhật ký'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, query, refresh]);
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Nhật ký hoạt động</h1>
    <p className="text-muted-foreground">Tra cứu người thực hiện, thời gian và nội dung thay đổi trong hệ thống.</p>
    <form className="flex flex-wrap gap-3" onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
      <input aria-label="Tìm nhật ký" value={search} maxLength={150} onChange={e => setSearch(e.target.value)} placeholder="Tên người dùng, hành động, nội dung..." className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3" />
      <button className="rounded-xl bg-primary text-primary-foreground px-5 py-3">Tìm kiếm</button>
      <button type="button" onClick={() => setRefresh(v => v + 1)} className="rounded-xl border border-border px-4 py-3">Tải lại</button>
    </form>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-border" aria-busy={loading}>
      <table className="admin-data-table w-full min-w-[700px] text-sm text-left">
        <thead className="bg-muted"><tr>{['Thời gian', 'Người thực hiện', 'Hành động', 'Nội dung'].map(title => <th key={title} className="p-4">{title}</th>)}</tr></thead>
        <tbody>{loading ? <tr><td colSpan={4} className="p-8 text-center">Đang tải...</td></tr> : data.items.length === 0 ? <tr><td colSpan={4} className="p-8 text-center">Không có nhật ký phù hợp.</td></tr> : data.items.map(item => <tr key={item.log_id} className="border-t border-border">
          <td className="p-4 whitespace-nowrap">{new Date(item.created_at).toLocaleString('vi-VN')}</td>
          <td className="p-4">{item.actor_name || 'Tài khoản đã xóa'}</td>
          <td className="p-4 font-mono">{item.action}</td>
          <td className="p-4 break-words max-w-md">{item.description || '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{data.total} hoạt động • Trang {page}</span>
      <div className="flex gap-2"><button disabled={loading || page <= 1} onClick={() => setPage(v => v - 1)} className="border rounded-lg p-2 disabled:opacity-40">Trước</button><button disabled={loading || page * data.limit >= data.total} onClick={() => setPage(v => v + 1)} className="border rounded-lg p-2 disabled:opacity-40">Sau</button></div>
    </div>
  </div>;
}
