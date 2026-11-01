import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'sonner';

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(2);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => {
    setLoading(true); setError('');
    axiosClient.get('/roles').then(result => { setRoles(result.data.roles); setPermissions(result.data.permissions); }).catch(err => setError(err.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const current = roles.find(role => role.role_id === selected);
  const toggle = code => setRoles(previous => previous.map(role => role.role_id === selected ? { ...role, permissions: role.permissions.includes(code) ? role.permissions.filter(item => item !== code) : [...role.permissions, code] } : role));
  const save = async () => {
    if (!current || saving) return;
    setSaving(true);
    try { await axiosClient.put(`/roles/${selected}/permissions`, { permissions: current.permissions }); toast.success('Đã lưu phân quyền'); }
    catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6">
    <h1 className="text-2xl font-bold">Quyền quản trị viên và nhân viên</h1>
    <p className="text-sm text-muted-foreground">Hệ thống chỉ có một loại nhân viên. Nhân viên nhập kho của chi nhánh mình, bán tại quầy và xử lý đơn được phân công. User là khách đăng nhập; guest chỉ xem và phải đăng nhập để đặt hàng.</p>
    <p className="text-muted-foreground">Quyền mới có hiệu lực ngay ở API. Nhân viên tải lại trang để cập nhật menu.</p>
    {error && <div role="alert" className="text-destructive">{error} <button onClick={load} className="underline">Thử lại</button></div>}
    {loading ? <p role="status">Đang tải phân quyền...</p> : <>
      <label className="block font-medium">Vai trò
        <select disabled={saving} value={selected} onChange={e => setSelected(Number(e.target.value))} className="block mt-2 rounded-xl border border-border bg-background p-3 w-full sm:w-72">{roles.map(role => <option key={role.role_id} value={role.role_id}>{role.role_id === 2 ? 'Nhân viên' : 'Quản trị viên'}</option>)}</select>
      </label>
      {selected === 1 && <p>Quản trị viên có toàn quyền và không thể bị bỏ quyền.</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{permissions.filter(permission => selected === 1 || !['products.manage', 'catalog.manage', 'promotions.manage'].includes(permission.permission_code)).map(permission => <label key={permission.permission_id} className="flex gap-3 items-start border border-border rounded-xl p-4 cursor-pointer">
        <input type="checkbox" disabled={selected === 1 || saving} checked={current?.permissions.includes(permission.permission_code) || false} onChange={() => toggle(permission.permission_code)} className="mt-1 size-4 accent-primary" />
        <span><span className="block font-medium">{permission.description}</span><span className="text-xs text-muted-foreground">{permission.permission_code}</span></span>
      </label>)}</div>
      <button disabled={selected === 1 || saving || !current} onClick={save} className="rounded-xl px-6 py-3 bg-primary text-primary-foreground disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu phân quyền'}</button>
    </>}
  </div>;
}
