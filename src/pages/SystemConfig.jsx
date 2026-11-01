import { useCallback, useEffect, useState } from 'react';
import { Store, CreditCard, Mail, Save, Loader2 } from 'lucide-react';
import EmailSettings from '../components/admin/EmailSettings';
import configApi from '../api/configApi';
import axiosClient from '../api/axiosClient';
import { toast } from 'sonner';

const defaults = {
  store_name: '', store_phone: '', store_email: '', store_address: '', store_logo_url: '',
  shipping_fee: '30000', free_shipping_threshold: '500000',
  bank_bin: '', bank_account_number: '', bank_account_name: ''
};
const tabs = [
  { id: 'general', icon: Store, label: 'Cửa hàng & giao hàng' },
  { id: 'payment', icon: CreditCard, label: 'Thanh toán' },
  { id: 'email', icon: Mail, label: 'Email' }
];
const fieldClass = 'mt-2 block w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary';

export default function SystemConfig() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const [integrations, setIntegrations] = useState({ payments: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [integrationError, setIntegrationError] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setLoadError(''); setIntegrationError(false);
    const [config, services] = await Promise.allSettled([configApi.getSettings(), axiosClient.get('/config/integrations')]);
    if (config.status === 'fulfilled' && config.value.success) {
      const data = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, String(config.value.data?.[key] ?? fallback)]));
      setSettings(data); setSaved(data);
    } else setLoadError('Không tải được cấu hình cửa hàng. Vui lòng thử lại trước khi chỉnh sửa.');
    if (services.status === 'fulfilled') setIntegrations(services.value.data);
    else setIntegrationError(true);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const change = event => { setSaveError(''); setSettings(current => ({ ...current, [event.target.name]: event.target.value })); };
  const save = async () => {
    if (saving || loading || loadError || !dirty) return;
    if (!document.getElementById('settings-fields')?.reportValidity() && activeTab !== 'email') return;
    if (!settings.store_name.trim()) { setSaveError('Vui lòng nhập tên cửa hàng trong mục Cửa hàng & giao hàng.'); return; }
    const bankFields = [settings.bank_bin, settings.bank_account_number, settings.bank_account_name];
    const bankChanged = ['bank_bin', 'bank_account_number', 'bank_account_name'].some(key => settings[key] !== saved[key]);
    if (bankChanged && bankFields.some(value => value.trim()) && bankFields.some(value => !value.trim())) { setSaveError('Vui lòng điền đủ ngân hàng, số tài khoản và tên chủ tài khoản trong mục Thanh toán.'); return; }
    setSaving(true); setSaveError('');
    const payload = Object.fromEntries(Object.keys(defaults).map(key => [key, String(settings[key] ?? '').trim()]));
    try {
      const result = await configApi.updateSettings(payload);
      if (!result.success) throw new Error(result.message || 'Không lưu được cấu hình');
      setSettings(payload); setSaved(payload);
      toast.success('Đã lưu cấu hình cửa hàng');
    } catch (error) {
      setSaveError(error.response?.data?.message || error.message || 'Không lưu được cấu hình');
    } finally { setSaving(false); }
  };
  return <div className="space-y-6 pb-10">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Cài đặt hệ thống</h1><p className="mt-1 text-sm text-muted-foreground">Thông tin cửa hàng, giao hàng, thanh toán và email.</p></div>
      <button type="button" onClick={save} disabled={saving || loading || !!loadError || !dirty} className="flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-5 py-3 text-sm font-bold disabled:opacity-40">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
    </header>
    {saveError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">{saveError}</p>}
    {dirty && <p role="status" className="text-sm text-muted-foreground">Bạn có thay đổi chưa lưu.</p>}
    {loading ? <div role="status" className="flex items-center justify-center gap-2 py-16"><Loader2 className="animate-spin" size={20} />Đang tải cấu hình...</div> : loadError ? <div role="alert" className="rounded-xl border p-5"><p>{loadError}</p><button onClick={load} className="mt-3 rounded-lg border px-4 py-2">Tải lại</button></div> : <>
      <nav aria-label="Nhóm cài đặt" className="flex flex-wrap gap-2">{tabs.map(({ id, icon: Icon, label }) => <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === id ? 'bg-foreground text-background' : 'border border-border hover:bg-muted'}`}><Icon size={18} />{label}</button>)}</nav>
      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
        {activeTab === 'general' && <form id="settings-fields" onSubmit={event => { event.preventDefault(); save(); }} className="space-y-8">
          <section><h2 className="font-bold text-lg mb-4">Thông tin cửa hàng</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="text-sm font-medium">Tên cửa hàng *<input required maxLength={150} name="store_name" value={settings.store_name} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium">Số điện thoại hỗ trợ<input type="tel" maxLength={20} name="store_phone" value={settings.store_phone} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium">Email hỗ trợ<input type="email" maxLength={254} name="store_email" value={settings.store_email} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium">Địa chỉ cửa hàng<input maxLength={255} name="store_address" value={settings.store_address} onChange={change} className={fieldClass} /></label>
          </div><p className="text-xs text-muted-foreground mt-3">Thông tin này được dùng trong email, hóa đơn và hỗ trợ khách hàng.</p></section>
          <section className="border-t border-border pt-6"><h2 className="font-bold text-lg mb-4">Phí giao hàng</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="text-sm font-medium">Phí giao hàng (VNĐ)<input required type="number" min="0" max="9999999999" step="1" name="shipping_fee" value={settings.shipping_fee} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium">Giá trị đơn được miễn phí giao hàng (VNĐ)<input required type="number" min="0" max="9999999999" step="1" name="free_shipping_threshold" value={settings.free_shipping_threshold} onChange={change} className={fieldClass} /></label>
          </div></section>
        </form>}
        {activeTab === 'payment' && <form id="settings-fields" onSubmit={event => { event.preventDefault(); save(); }} className="space-y-7">
          <section><h2 className="text-lg font-bold mb-4">Cổng thanh toán online</h2>{integrationError ? <p role="alert" className="text-sm text-muted-foreground">Chưa tải được trạng thái cấu hình dịch vụ. Tải lại trang để kiểm tra.</p> : <div className="grid sm:grid-cols-3 gap-3">{[['vnpay', 'VNPay'], ['momo', 'MoMo'], ['stripe', 'Stripe']].map(([key, label]) => <div key={key} className="rounded-xl border border-border p-4"><p className="font-bold">{label}</p><p className={`mt-1 text-sm ${integrations.payments[key] ? 'text-emerald-600' : 'text-muted-foreground'}`}>{integrations.payments[key] ? 'Đã cấu hình' : 'Chưa cấu hình'}</p></div>)}</div>}</section>
          <section className="border-t border-border pt-6"><h2 className="text-lg font-bold mb-4">Tài khoản nhận VietQR tại quầy</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="text-sm font-medium">Mã BIN ngân hàng<input name="bank_bin" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6 chữ số" value={settings.bank_bin} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium">Số tài khoản<input name="bank_account_number" pattern="[A-Za-z0-9]{4,30}" maxLength={30} value={settings.bank_account_number} onChange={change} className={fieldClass} /></label>
            <label className="text-sm font-medium sm:col-span-2">Tên chủ tài khoản<input name="bank_account_name" maxLength={100} value={settings.bank_account_name} onChange={change} className={fieldClass} /></label>
          </div><p className="text-sm text-muted-foreground mt-3">Mã QR tại POS dùng số tiền của đơn. Thu ngân kiểm tra tiền thực nhận trước khi xác nhận.</p></section>
        </form>}
        {activeTab === 'email' && <EmailSettings settings={settings} setSettings={setSettings} status={integrations.email_status} onEditStore={() => setActiveTab('general')} />}
      </section>
    </>}
  </div>;
}
