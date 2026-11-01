import { Inbox, Loader2 } from 'lucide-react';

export default function AdminDataTable({ columns, rows, rowKey, loading = false, emptyMessage = 'Chưa có dữ liệu', caption }) {
  return <div className="admin-table-scroll overflow-x-auto">
    <table className="admin-data-table w-full text-left border-collapse">
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead><tr>{columns.map(column => <th key={column.key} scope="col" className={column.className || ''}>{column.label}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan={columns.length}><div role="status" className="table-empty"><Loader2 size={24} className="animate-spin" /><p>Đang tải dữ liệu...</p></div></td></tr> : !rows.length ? <tr><td colSpan={columns.length}><div className="table-empty"><span className="table-empty-icon"><Inbox size={25} strokeWidth={1.5} /></span><p>{emptyMessage}</p></div></td></tr> : rows.map(row => <tr key={rowKey(row)}>{columns.map(column => <td key={column.key} className={column.className || ''}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
