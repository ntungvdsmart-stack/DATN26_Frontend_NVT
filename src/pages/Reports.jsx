import ReportCharts, { OrderVolumeChart, ReportChartCard } from '../components/admin/ReportCharts';
import { useEffect, useState } from 'react';
import { RefreshCw, Download, Wallet, ShoppingBag, Users, TrendingUp, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../api/axiosClient';
import Pagination from '../components/shared/Pagination';
import useListPagination from '../lib/useListPagination';
import ProductImage from '../components/shared/ProductImage';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const compact = value => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
const dayString = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const periodLabel = value => value.length === 7 ? `${value.slice(5)}/${value.slice(0,4)}` : `${value.slice(8)}/${value.slice(5,7)}`;

export default function Reports() {
  const [filters,setFilters] = useState({preset:'all',start:'',end:'',channel:'',branch_id:''});
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [refresh,setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if(filters.preset==='custom' && (!filters.start||!filters.end||filters.start>filters.end)) { setLoading(false); setError('Chọn đủ ngày bắt đầu và kết thúc hợp lệ.'); return () => controller.abort(); }
    setLoading(true); setError('');
    const params={channel:filters.channel||undefined,branch_id:filters.branch_id||undefined};
    if(filters.preset!=='all') {
      if(filters.preset==='custom') {params.start=filters.start;params.end=filters.end;}
      else {const end=new Date(),start=new Date();start.setDate(start.getDate()-(Number(filters.preset)-1));params.start=dayString(start);params.end=dayString(end);}
    }
    axiosClient.get('/stats/report',{params,signal:controller.signal}).then(result=>{if(!controller.signal.aborted){if(!result.success)throw new Error(result.message);setData(result.data);}})
      .catch(err=>{if(!controller.signal.aborted)setError(err.message||'Không tải được báo cáo.');})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[filters,refresh]);
  const rows=data?.series||[];
  const tablePage=useListPagination(rows,JSON.stringify(filters));
  const summary=data?.summary;
  const change=(key,value)=>setFilters(previous=>({...previous,[key]:value}));
  const download=()=>{
    if(!data||loading||error)return;
    const cell=value=>{ const text=String(value??''); return `"${(/^[=+@\-\t\r]/.test(text)?"'"+text:text).replace(/"/g,'""')}"`; };
    const sections=[
      ['BÁO CÁO THỐNG KÊ'],['Từ ngày',data.meta.start,'Đến ngày',data.meta.end],['Kênh',data.meta.channel||'Tất cả','Chi nhánh',data.branches.find(branch=>Number(branch.branch_id)===data.meta.branch_id)?.branch_name||'Tất cả'],[],
      ['TỔNG QUAN'],['Tổng đơn','Khách có đơn','Doanh thu','Đã thu','Đã hoàn'],[summary.orders,summary.customers,summary.revenue,summary.collected,summary.refunded],[],
      ['CHI TIẾT THEO KỲ'],['Kỳ','Tổng đơn','Khách có đơn trong kỳ','Doanh thu','Đã thu'],...rows.map(row=>[row.period,row.orders,row.customers,row.revenue,row.collected]),[],
      ['TRẠNG THÁI ĐƠN'],['Trạng thái','Số đơn'],...data.statuses.map(row=>[row.status,row.count]),[],
      ['KÊNH BÁN'],['Kênh','Số đơn','Doanh thu','Đã thu'],...data.channels.map(row=>[row.channel,row.orders,row.revenue,row.collected]),[],
      ['CHI NHÁNH'],['Tên','Số đơn','Doanh thu','Đã thu'],...(data.branchStats||[]).map(row=>[row.name,row.orders,row.revenue,row.collected]),[],
      ['THANH TOÁN'],['Phương thức','Số giao dịch','Đã thu'],...data.payments.map(row=>[row.method,row.count,row.amount]),[],
      ['TOP SẢN PHẨM'],['Tên','Số lượng bán','Doanh thu hàng hóa'],...data.products.map(row=>[row.name,row.sold,row.revenue]),[],
      ['TOP DANH MỤC'],['Tên','Doanh thu hàng hóa'],...data.categories.map(row=>[row.name,row.revenue])
    ];
    const csv='\uFEFF'+sections.map(row=>row.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const link=document.createElement('a');link.href=url;link.download=`bao-cao-${data.meta.start||'all'}-${data.meta.end||'all'}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const cards=summary ? [
    {label:'Doanh thu',value:money(summary.revenue),note:'Đơn đang giao / hoàn tất, trừ hoàn tiền',icon:TrendingUp},
    {label:'Tiền đã thu',value:money(summary.collected),note:'Thanh toán thành công, trừ tiền đã hoàn',icon:Wallet},
    {label:'Tổng đơn hàng',value:summary.orders.toLocaleString('vi-VN'),note:`${summary.processing} đang xử lý · ${summary.completed} hoàn thành`,icon:ShoppingBag},
    {label:'Khách đã mua',value:summary.customers.toLocaleString('vi-VN'),note:'Số khách khác nhau có đơn trong bộ lọc',icon:Users}
  ] : [];
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="customer-eyebrow">PHÂN TÍCH KINH DOANH</p><h1>Tổng quan & Báo cáo</h1><p className="text-sm text-muted-foreground mt-2">Dữ liệu đơn hàng và thanh toán thực tế, thống nhất theo bộ lọc.</p></div><div className="flex gap-2"><button className="customer-secondary" disabled={loading} onClick={()=>setRefresh(value=>value+1)}><RefreshCw size={15} className={loading?'animate-spin':''} />Làm mới</button><button className="customer-primary" disabled={loading||!data||Boolean(error)} onClick={download}><Download size={15} />Xuất CSV</button></div></header>
    <section className="customer-surface p-4 sm:p-5 flex flex-wrap items-end gap-3" aria-label="Bộ lọc báo cáo">
      <label className="text-xs text-muted-foreground space-y-2 flex-1 min-w-[150px]">Thời gian<select className="customer-input block w-full px-3" value={filters.preset} onChange={event=>change('preset',event.target.value)}><option value="all">Toàn bộ dữ liệu</option><option value="7">7 ngày gần nhất</option><option value="30">30 ngày gần nhất</option><option value="365">365 ngày gần nhất</option><option value="custom">Chọn khoảng ngày</option></select></label>
      {filters.preset==='custom' && <><label className="text-xs text-muted-foreground space-y-2 flex-1 min-w-[140px]">Từ ngày<input type="date" className="customer-input block w-full px-3" value={filters.start} max={filters.end||undefined} onChange={event=>change('start',event.target.value)} /></label><label className="text-xs text-muted-foreground space-y-2 flex-1 min-w-[140px]">Đến ngày<input type="date" className="customer-input block w-full px-3" value={filters.end} min={filters.start||undefined} onChange={event=>change('end',event.target.value)} /></label></>}
      <label className="text-xs text-muted-foreground space-y-2 flex-1 min-w-[140px]">Kênh bán<select className="customer-input block w-full px-3" value={filters.channel} onChange={event=>change('channel',event.target.value)}><option value="">Tất cả kênh</option><option value="online">Online</option><option value="pos">Tại quầy (POS)</option></select></label>
      <label className="text-xs text-muted-foreground space-y-2 flex-1 min-w-[160px]">Chi nhánh<select className="customer-input block w-full px-3" value={filters.branch_id} onChange={event=>change('branch_id',event.target.value)}><option value="">Tất cả chi nhánh</option>{data?.branches.map(branch=><option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>)}</select></label>
    </section>
    {loading ? <div role="status" className="space-y-5"><span className="sr-only">Đang tải báo cáo</span><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[1,2,3,4].map(id=><div key={id} className="h-36 bg-muted rounded-2xl animate-pulse" />)}</div><div className="h-72 bg-muted rounded-2xl animate-pulse" /></div> : error ? <div role="alert" className="customer-surface p-8 text-center space-y-3"><AlertCircle className="mx-auto text-destructive" /><p className="text-sm">{error}</p><button className="customer-secondary" onClick={()=>setRefresh(value=>value+1)}>Thử lại</button></div> : data && <>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{data.meta.start ? `Dữ liệu từ ${data.meta.start} đến ${data.meta.end}` : 'Chưa có đơn hàng trong bộ lọc đã chọn'}</span><span>Cập nhật {new Date(data.meta.generated_at).toLocaleString('vi-VN')}</span></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(({label,value,note,icon:Icon})=><article key={label} className="customer-surface p-5 min-w-0"><div className="flex items-center justify-between mb-5"><h2 className="text-xs text-muted-foreground">{label}</h2><Icon size={18} strokeWidth={1.6} className="text-muted-foreground" /></div><p className="text-xl sm:text-2xl font-semibold tracking-tight break-words">{value}</p><p className="text-[10px] text-muted-foreground mt-3 leading-5">{note}</p></article>)}</div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground rounded-xl bg-muted/50 p-4"><span>Giá trị đơn chưa hủy: <strong className="text-foreground">{money(summary.orderValue)}</strong></span><span>Đã hoàn tiền: <strong className="text-foreground">{money(summary.refunded)}</strong></span><span>Đã hủy: <strong className="text-foreground">{summary.cancelled} đơn</strong></span><span>Đang giao: <strong className="text-foreground">{summary.shipping} đơn</strong></span></div>
      <div className="report-chart-grid grid xl:grid-cols-2 gap-5">
      <ReportChartCard title="Doanh thu và tiền đã thu" subtitle={`Theo ${data.meta.group==='month'?'tháng':'ngày'} đặt đơn · Đơn vị: đồng`} legend={<div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px]"><span className="flex items-center gap-2"><i className="w-2 h-2 bg-indigo-500 rounded-full"/>Doanh thu</span><span className="flex items-center gap-2"><i className="w-2 h-2 bg-emerald-500 rounded-full"/>Đã thu</span></div>}>{rows.length ? <div className="h-[280px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={rows} margin={{left:0,right:16,top:12,bottom:8}}><defs><linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={.18} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" /><XAxis dataKey="period" tickFormatter={periodLabel} tick={{fontSize:10}} tickLine={false} axisLine={false} tickMargin={10} height={35} minTickGap={30} /><YAxis tickFormatter={compact} tick={{fontSize:10}} tickLine={false} axisLine={false} width={65} /><Tooltip formatter={(value,name)=>[money(value),name]} labelFormatter={value=>`Kỳ ${value}`} contentStyle={{borderRadius:12,background:'var(--color-card)',border:'1px solid var(--color-border)',fontSize:12}} /><Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" fill="url(#reportRevenue)" strokeWidth={2} dot={rows.length === 1 ? { r: 4 } : false} activeDot={{ r: 5 }} /><Area type="monotone" dataKey="collected" name="Đã thu" stroke="#10b981" fill="transparent" strokeWidth={2} dot={rows.length === 1 ? { r: 4 } : false} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div> : <p className="py-16 text-center text-sm text-muted-foreground">Không có đơn hàng trong khoảng đã chọn.</p>}</ReportChartCard>
        <OrderVolumeChart rows={rows} group={data.meta.group} total={summary.orders} />
      </div>
      <ReportCharts data={data} />
      <div className="space-y-5"><section className="admin-table-panel"><div className="admin-table-toolbar"><h2 className="font-semibold text-sm">Sản phẩm bán chạy</h2><span className="text-xs text-muted-foreground">Tối đa 10 sản phẩm</span></div><div className="overflow-x-auto"><table className="admin-data-table w-full text-left"><thead><tr><th>Sản phẩm</th><th>Đã bán</th><th>Doanh thu hàng hóa</th></tr></thead><tbody>{data.products.map(row=><tr key={row.id}><td><div className="flex items-center gap-3"><ProductImage src={row.image} alt={row.name} className="w-9 h-11 rounded-lg object-cover shrink-0 bg-muted" /><span className="font-medium">{row.name}</span></div></td><td>{row.sold}</td><td className="whitespace-nowrap">{money(row.revenue)}</td></tr>)}{!data.products.length&&<tr><td colSpan={3} className="text-center text-muted-foreground">Chưa có sản phẩm thuộc đơn đang giao / hoàn tất trong bộ lọc.</td></tr>}</tbody></table></div></section></div>
      <section className="admin-table-panel"><div className="admin-table-toolbar"><h2 className="font-semibold text-sm flex items-center gap-2"><ArrowRightLeft size={16} />Chi tiết theo kỳ</h2><span className="text-xs text-muted-foreground">{rows.length} kỳ</span></div><div className="overflow-x-auto"><table className="admin-data-table w-full text-left"><thead><tr><th>{data.meta.group==='month'?'Tháng':'Ngày'}</th><th>Tổng đơn</th><th>Doanh thu</th><th>Tiền đã thu</th></tr></thead><tbody>{tablePage.items.map(row=><tr key={row.period}><td>{row.period}</td><td>{row.orders}</td><td>{money(row.revenue)}</td><td>{money(row.collected)}</td></tr>)}{!rows.length&&<tr><td colSpan={4} className="text-center text-muted-foreground">Chưa có dữ liệu</td></tr>}</tbody></table></div>{rows.length>0&&<div className="admin-table-footer"><Pagination {...tablePage.paginationProps} /></div>}</section>
      <p className="text-xs text-muted-foreground leading-6">Tất cả khối trên dùng cùng bộ lọc ngày đặt đơn, kênh bán và chi nhánh. Doanh thu chỉ ghi nhận đơn đang giao, hoàn tất hoặc trả hàng sau khi trừ tiền hoàn; tiền đã thu có thể gồm đơn đã thanh toán nhưng còn chờ xử lý. Doanh thu hàng hóa không gồm phí giao hàng, đã phân bổ giảm giá và trừ số lượng trả hoàn tất.</p>
    </>}
  </div>;
}
