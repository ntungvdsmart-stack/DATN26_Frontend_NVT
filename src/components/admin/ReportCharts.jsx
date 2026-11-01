import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const colors = ['#6366f1','#10b981','#f59e0b','#0ea5e9','#ec4899','#8b5cf6','#f97316'];
const statusColors = { pending:'#f59e0b',confirmed:'#6366f1',processing:'#8b5cf6',shipping:'#0ea5e9',completed:'#10b981',cancelled:'#ef4444',returned:'#ec4899' };
const statuses = { pending:'Chờ xác nhận',confirmed:'Đã xác nhận',processing:'Chuẩn bị hàng',shipping:'Đang giao',completed:'Hoàn thành',cancelled:'Đã hủy',returned:'Đã trả hàng' };
const methods = { cash:'Tiền mặt / COD',stripe:'Stripe',bank_transfer:'Chuyển khoản',vnpay:'VNPAY',momo:'MoMo' };
const money = value => `${Number(value||0).toLocaleString('vi-VN')}đ`;
const compact = value => new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(Number(value||0));
const date = value => value.length===7 ? `${value.slice(5)}/${value.slice(0,4)}` : `${value.slice(8)}/${value.slice(5,7)}`;
const tipStyle = {borderRadius:12,background:'var(--color-card)',color:'var(--color-foreground)',border:'1px solid var(--color-border)',fontSize:12,boxShadow:'0 8px 24px #00000012'};

function Empty({ text = 'Chưa có dữ liệu trong bộ lọc đã chọn' }) {
  return <div className="flex flex-col items-center justify-center gap-3 h-[280px] text-center px-4"><BarChart3 size={30} strokeWidth={1.4} className="text-muted-foreground/50" /><p className="text-xs text-muted-foreground leading-6 max-w-xs">{text}</p></div>;
}
export function ReportChartCard({ title, subtitle, children, className='', legend }) {
  return <section className={`customer-surface report-chart-card ${className}`}><header className="report-chart-header"><div><h2 className="font-semibold text-sm leading-6">{title}</h2><p className="text-xs text-muted-foreground mt-1.5 leading-5">{subtitle}</p></div>{legend}</header><div className="report-chart-body">{children}</div></section>;
}
export function OrderVolumeChart({ rows, group, total }) {
  return <ReportChartCard title="Số đơn hàng theo thời gian" subtitle={`${Number(total).toLocaleString('vi-VN')} đơn · Gồm mọi trạng thái · Theo ${group==='month'?'tháng':'ngày'} đặt đơn`}>
    {rows.length ? <div className="h-[280px] w-full" role="img" aria-label={`Biểu đồ số đơn theo kỳ, tổng ${total} đơn`}><ResponsiveContainer width="100%" height="100%"><BarChart data={rows} margin={{top:12,right:16,left:0,bottom:8}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="period" tickFormatter={date} tick={{fontSize:10}} tickMargin={10} height={35} tickLine={false} axisLine={false} minTickGap={30}/><YAxis width={65} allowDecimals={false} tick={{fontSize:10}} tickLine={false} axisLine={false}/><Tooltip contentStyle={tipStyle} labelFormatter={value=>`Kỳ ${value}`} formatter={value=>[`${value} đơn`,'Số đơn']}/><Bar dataKey="orders" name="Số đơn" fill="#6366f1" radius={[5,5,0,0]} maxBarSize={44}/></BarChart></ResponsiveContainer></div> : <Empty/>}
  </ReportChartCard>;
}
function Distribution({title,subtitle,rows,valueKey,currency=false,centerLabel}) {
  const positive=rows.filter(row=>Number(row[valueKey])>0);
  const total=positive.reduce((sum,row)=>sum+Number(row[valueKey]),0);
  return <ReportChartCard title={title} subtitle={subtitle}>
    {!positive.length ? <Empty/> : <>
      <div className="h-[280px] relative" role="img" aria-label={`${title}: ${positive.map(row=>`${row.name}: ${row[valueKey]}`).join(', ')}`}>
        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none"><strong className="text-2xl font-semibold tracking-tight">{compact(total)}</strong><span className="text-[10px] text-muted-foreground mt-1">{centerLabel}</span></div>
        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={positive} dataKey={valueKey} nameKey="name" innerRadius="65%" outerRadius="88%" paddingAngle={positive.length>1?4:0} stroke="none">{positive.map((row,index)=><Cell key={row.name} fill={row.color||colors[index%colors.length]}/>)}</Pie><Tooltip contentStyle={tipStyle} formatter={(value,name)=>[currency?money(value):`${value} đơn`,name]}/></PieChart></ResponsiveContainer>
      </div>
      <div className="report-chart-notes space-y-3 mt-4">{positive.map((row,index)=><div key={row.name} className="flex items-start justify-between gap-3 text-xs"><span className="flex items-center gap-2 min-w-0"><i className="w-2 h-2 rounded-full shrink-0" style={{background:row.color||colors[index%colors.length]}}/><span className="break-words">{row.name}</span></span><span className="text-right shrink-0"><strong className="font-medium">{currency?money(row[valueKey]):`${row[valueKey]} đơn`}</strong><span className="block text-[10px] text-muted-foreground mt-1">{(Number(row[valueKey])/total*100).toFixed(1)}%</span></span></div>)}</div>
    </>}
  </ReportChartCard>;
}

export default function ReportCharts({data}) {
  const channels=data.channels.map(row=>({...row,name:row.channel==='pos'?'Tại quầy (POS)':'Online'}));
  const categories=data.categories;
  const products=data.products;
  return <div className="space-y-5">
    <div className="report-chart-grid grid xl:grid-cols-2 gap-5">
      <ReportChartCard title="Khách có đơn theo thời gian" subtitle="Khách khác nhau trong từng kỳ; một khách có thể xuất hiện ở nhiều kỳ">
        {!data.series.length ? <Empty/> : <div className="h-[280px]" role="img" aria-label="Biểu đồ khách có đơn theo thời gian"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.series} margin={{left:0,right:16,top:12,bottom:8}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="period" tickFormatter={date} tick={{fontSize:10}} tickMargin={10} height={35} tickLine={false} axisLine={false} minTickGap={30}/><YAxis width={65} allowDecimals={false} tick={{fontSize:10}} tickLine={false} axisLine={false}/><Tooltip contentStyle={tipStyle} labelFormatter={value=>`Kỳ ${value}`} formatter={value=>[`${value} khách`,'Khách có đơn']}/><Line type="monotone" dataKey="customers" name="Khách có đơn" stroke="#0ea5e9" strokeWidth={2} dot={data.series.length<8?{r:3}:false} activeDot={{r:5}}/></LineChart></ResponsiveContainer></div>}
      </ReportChartCard>
      <ReportChartCard title="Hiệu quả theo chi nhánh" subtitle="Đơn chưa được phân chi nhánh được hiển thị thành một nhóm riêng">
        {!data.branchStats?.length ? <Empty/> : <div className="report-chart-viewport" role="img" aria-label="Biểu đồ doanh thu và tiền đã thu theo chi nhánh"><div style={{height:Math.max(280,data.branchStats.length*75)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.branchStats} layout="vertical" margin={{left:0,right:15,top:8,bottom:5}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" horizontal={false}/><XAxis type="number" tickFormatter={compact} tick={{fontSize:10}} tickLine={false} axisLine={false}/><YAxis type="category" dataKey="name" tickFormatter={value=>value.length>18?`${value.slice(0,18)}...`:value} width={115} tick={{fontSize:10}} tickLine={false} axisLine={false}/><Tooltip contentStyle={tipStyle} formatter={(value,name)=>[money(value),name]}/><Legend height={36} verticalAlign="bottom" wrapperStyle={{fontSize:11,paddingTop:12}} iconType="circle" iconSize={8}/><Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[0,4,4,0]} maxBarSize={18}/><Bar dataKey="collected" name="Đã thu" fill="#10b981" radius={[0,4,4,0]} maxBarSize={18}/></BarChart></ResponsiveContainer></div></div>}
      </ReportChartCard>
    </div>
    <div className="report-chart-grid grid 2xl:grid-cols-3 gap-5">
      <Distribution title="Tỷ trọng trạng thái đơn" subtitle="Bao gồm đơn chờ xử lý, đã giao và đã hủy" rows={data.statuses.map(row=>({...row,name:statuses[row.status]||row.status,color:statusColors[row.status]}))} valueKey="count" centerLabel="đơn hàng"/>
      <ReportChartCard title="Doanh thu theo kênh" subtitle="So sánh doanh thu ghi nhận và tiền thực tế đã thu">
        {!channels.length ? <Empty/> : <><div className="h-[280px]" role="img" aria-label="Biểu đồ so sánh doanh thu và tiền đã thu Online, POS"><ResponsiveContainer width="100%" height="100%"><BarChart data={channels} margin={{left:0,right:16,top:12,bottom:8}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}} tickLine={false} axisLine={false}/><YAxis tickFormatter={compact} tick={{fontSize:10}} tickLine={false} axisLine={false} width={65}/><Tooltip formatter={(value,name)=>[money(value),name]} contentStyle={tipStyle}/><Legend height={36} verticalAlign="bottom" wrapperStyle={{fontSize:11,paddingTop:12}} iconType="circle" iconSize={8}/><Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={36}/><Bar dataKey="collected" name="Đã thu" fill="#10b981" radius={[4,4,0,0]} maxBarSize={36}/></BarChart></ResponsiveContainer></div><div className="report-chart-notes border-t border-border mt-4 pt-4 space-y-2">{channels.map(row=><div key={row.channel} className="flex justify-between text-xs gap-2"><span>{row.name}</span><span className="text-muted-foreground">{row.orders} đơn · Đã thu {money(row.collected)}</span></div>)}</div></>}
      </ReportChartCard>
      <Distribution title="Cơ cấu thanh toán" subtitle="Giao dịch thành công, đã trừ khoản hoàn tiền" rows={data.payments.map(row=>({...row,name:methods[row.method]||row.method}))} valueKey="amount" centerLabel="đồng đã thu" currency/>
    </div>
    <div className="report-chart-grid grid xl:grid-cols-2 gap-5">
      <ReportChartCard title="Doanh thu hàng hóa theo danh mục" subtitle="Không gồm phí ship · Đã phân bổ giảm giá và trừ lượng trả hoàn tất">
        {!categories.length ? <Empty text="Chưa có doanh thu hàng hóa được ghi nhận trong bộ lọc này"/> : <><div className="report-chart-viewport" role="img" aria-label="Biểu đồ doanh thu theo danh mục"><div style={{height:Math.max(280,categories.length*48)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={categories} layout="vertical" margin={{left:0,right:20,top:5,bottom:5}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" horizontal={false}/><XAxis type="number" tickFormatter={compact} tick={{fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" tickFormatter={value=>value.length>18?`${value.slice(0,18)}...`:value} width={115} tick={{fontSize:11}} axisLine={false} tickLine={false}/><Tooltip formatter={value=>[money(value),'Doanh thu']} contentStyle={tipStyle}/><Bar dataKey="revenue" name="Doanh thu" radius={[0,5,5,0]} maxBarSize={26}>{categories.map((row,index)=><Cell key={row.name} fill={colors[index%colors.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></div><div className="report-chart-notes flex flex-wrap gap-x-5 gap-y-2 mt-4 border-t border-border pt-4">{categories.map(row=><span key={row.name} className="text-xs text-muted-foreground">{row.name}: <strong className="text-foreground font-medium">{money(row.revenue)}</strong></span>)}</div></>}
      </ReportChartCard>
      <ReportChartCard title="Top sản phẩm theo số lượng bán" subtitle="Tối đa 10 sản phẩm thuộc đơn đang giao / hoàn tất, trừ số lượng trả">
        {!products.length ? <Empty text="Chưa có sản phẩm thuộc đơn đang giao / hoàn tất trong bộ lọc này"/> : <div className="report-chart-viewport" role="img" aria-label="Biểu đồ số lượng sản phẩm bán chạy"><div style={{height:Math.max(280,products.length*48)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={products.map(row=>({...row,shortName:row.name.length>22?`${row.name.slice(0,22)}…`:row.name}))} layout="vertical" margin={{left:0,right:20,top:5,bottom:5}}><CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" horizontal={false}/><XAxis type="number" allowDecimals={false} tick={{fontSize:10}} tickLine={false} axisLine={false}/><YAxis type="category" dataKey="shortName" width={115} tick={{fontSize:10}} tickLine={false} axisLine={false}/><Tooltip contentStyle={tipStyle} labelFormatter={(_,payload)=>payload?.[0]?.payload?.name||''} formatter={value=>[`${value} sản phẩm`,'Đã bán']}/><Bar dataKey="sold" name="Đã bán" fill="#0ea5e9" radius={[0,5,5,0]} maxBarSize={26}/></BarChart></ResponsiveContainer></div></div>}
      </ReportChartCard>
    </div>
  </div>;
}
