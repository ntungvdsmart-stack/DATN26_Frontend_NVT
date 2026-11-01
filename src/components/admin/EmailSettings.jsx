import { useEffect, useState } from 'react';
import { Loader2, Upload, Mail } from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '../../api/axiosClient';
import productApi from '../../api/productApi';

export default function EmailSettings({ settings, setSettings, status, onEditStore }) {
  const [type, setType] = useState('welcome');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [revision, setRevision] = useState(0);
  const [previewError, setPreviewError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setPreviewError('');
    axiosClient.get('/config/email-preview', { params: { type }, signal: controller.signal }).then(res => {
      if (!controller.signal.aborted) setHtml(res.data.html);
    }).catch(() => {
      if (!controller.signal.aborted) setPreviewError('Không tải được mẫu email.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type, revision]);
  const field = (name, value) => setSettings(prev => ({ ...prev, [name]: value }));
  const uploadLogo = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { toast.error('Chọn PNG/JPG tối đa 2 MB để hiển thị tốt trên ứng dụng email.'); return; }
    setUploading(true);
    try {
      const res = await productApi.uploadImages([file]);
      if (!res.data?.[0]?.url) throw new Error('Không nhận được logo đã tải lên');
      field('store_logo_url', res.data[0].url);
      toast.success('Đã tải logo. Nhấn Lưu thay đổi để áp dụng.');
    } catch (error) { toast.error(error.response?.data?.message || error.message || 'Không tải được logo'); }
    finally { setUploading(false); }
  };
  return <section className="space-y-6 min-w-0">
    <div><h3 className="font-bold text-lg">Email thương hiệu cửa hàng</h3><p className="text-sm text-muted-foreground mt-2">Email chào mừng, khôi phục mật khẩu và cập nhật đơn online dùng cùng nhận diện thương hiệu.</p></div>
    <div role="status" className={`rounded-xl border p-4 text-sm space-y-2 ${status?.test_mode ? 'border-amber-400/50 bg-amber-500/10' : 'border-border'}`}>
      <p>{!status ? 'Chưa tải được trạng thái dịch vụ email. Vui lòng tải lại trang để kiểm tra.' : status.configured ? `Đã cấu hình ${status.provider === 'resend' ? 'Resend' : 'SMTP'}.` : 'Chưa cấu hình dịch vụ gửi email.'}</p>
      {status?.sender && <p className="break-all">Địa chỉ gửi: {status.sender}</p>}
      {status?.test_mode && <p>Đang dùng địa chỉ gửi thử: chỉ gửi được tới email chủ tài khoản Resend. Muốn gửi cho khách hàng cần xác thực tên miền và đổi địa chỉ gửi ở backend.</p>}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2 rounded-xl bg-muted/40 p-4 text-sm space-y-1"><p className="font-semibold">{settings.store_name || 'Chưa đặt tên cửa hàng'}</p><p className="text-muted-foreground break-all">{settings.store_email || 'Chưa đặt email hỗ trợ'}</p>{onEditStore && <button type="button" onClick={onEditStore} className="underline underline-offset-4">Sửa thông tin cửa hàng</button>}</div>
      <label className="text-sm space-y-2 sm:col-span-2"><span>Đường dẫn logo HTTPS</span><input type="url" maxLength={1000} value={settings.store_logo_url || ''} onChange={event => field('store_logo_url', event.target.value)} placeholder="https://.../logo.png" className="w-full rounded-lg border bg-background px-3 py-3" /></label>
    </div>
    <label className="inline-flex items-center gap-2 rounded-lg border p-3 text-sm cursor-pointer"><Upload size={16} />{uploading ? 'Đang tải logo...' : 'Tải logo PNG/JPG'}<input disabled={uploading} type="file" accept="image/png,image/jpeg" onChange={uploadLogo} className="sr-only" /></label>
    <p className="text-xs text-muted-foreground">Nếu chưa có logo, email dùng biểu tượng chữ của shop. Nhấn “Lưu thay đổi”, sau đó “Tải lại mẫu” để xem nhận diện vừa lưu. Logo trong nội dung email không thay đổi ảnh đại diện của hộp thư.</p>
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label="Mẫu email" value={type} onChange={event => setType(event.target.value)} className="rounded-lg border bg-background px-3 py-3"><option value="welcome">Chào mừng</option><option value="reset">Khôi phục mật khẩu</option><option value="order">Đơn hàng</option></select>
      <button type="button" onClick={() => setRevision(value => value + 1)} className="rounded-lg border px-4 py-3 text-sm">Tải lại mẫu</button>
    </div>
    {loading ? <Loader2 className="animate-spin" aria-label="Đang tải mẫu" /> : previewError ? <p role="alert">{previewError}</p> : <iframe sandbox="" title="Xem trước email thương hiệu" srcDoc={html} className="w-full h-[620px] max-h-[80dvh] rounded-xl border bg-white" />}
    {sendError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">{sendError}</p>}
    <form className="flex flex-col sm:flex-row gap-3" onSubmit={async event => {
      event.preventDefault(); if (sending) return;
      setSending(true); setSendError('');
      try { const res = await axiosClient.post('/config/email-test', { to: recipient.trim() }); toast.success(res.message); }
      catch (error) { const message = error.response?.data?.message || 'Không gửi được email thử'; setSendError(message); toast.error(message); }
      finally { setSending(false); }
    }}>
      <input required type="email" maxLength={254} aria-label="Email nhận thử" placeholder="Email nhận thử" value={recipient} onChange={event => setRecipient(event.target.value)} className="flex-1 min-w-0 rounded-lg border bg-background px-3 py-3" />
      <button disabled={sending || !status?.configured} className="flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-4 py-3 text-sm disabled:opacity-50">{sending ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}Gửi email thử</button>
    </form>
  </section>;
}
