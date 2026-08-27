import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Package, ShoppingCart, Users, CreditCard,
  MonitorSmartphone, ClipboardList, MessageSquare, BarChart3, AlertTriangle,
  ArrowRight, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { statsData } from '../utils/statsData';
import { dummyOrders } from '../utils/dummyData';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── KPI Card ────────────────────────────────────────────
const KpiCard = ({ label, value, prev, format, icon: Icon, color }) => {
  const pct = ((value - prev) / prev * 100).toFixed(1);
  const up = pct > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-black">{format(value)}</p>
      <div className={cn('flex items-center gap-1 text-xs font-semibold', up ? 'text-emerald-600' : 'text-red-500')}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        <span>{up ? '+' : ''}{pct}% so với tháng trước</span>
      </div>
    </motion.div>
  );
};

// ─── Module shortcuts ────────────────────────────────────
const modules = [
  { title: 'Sản phẩm',     icon: Package,          color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   link: '/products', desc: 'CRUD, tồn kho' },
  { title: 'Bán Online',   icon: ShoppingCart,     color: 'text-pink-500',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20',   link: '/online',   desc: 'Giỏ hàng, khuyến mãi' },
  { title: 'Bán tại quầy', icon: MonitorSmartphone,color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', link: '/pos',      desc: 'POS, hóa đơn' },
  { title: 'Đơn hàng',     icon: ClipboardList,    color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  link: '/orders',   desc: 'Trạng thái, đổi trả' },
  { title: 'Thanh toán',   icon: CreditCard,       color: 'text-emerald-500',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',link: '/payments', desc: 'VNPay, Momo, QR' },
  { title: 'Chatbot AI',   icon: MessageSquare,    color: 'text-cyan-500',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   link: '/support',  desc: 'Tư vấn tự động' },
  { title: 'Khách hàng',   icon: Users,            color: 'text-rose-500',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20',   link: '/customers',desc: 'Tài khoản, lịch sử' },
  { title: 'Báo cáo',      icon: BarChart3,        color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', link: '/reports',  desc: 'Doanh thu, xu hướng' },
];

const activityIcon = { order: ShoppingCart, customer: Users, ship: Zap, stock: AlertTriangle };
const activityColor = { order: 'text-blue-500', customer: 'text-emerald-500', ship: 'text-purple-500', stock: 'text-amber-500' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
        <p className="font-bold text-sm mb-1">{label}</p>
        <p className="text-xs text-primary font-semibold">
          Doanh thu: {payload[0].value.toFixed(1)}M đ
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [chartMode, setChartMode] = useState('week'); // 'week' | 'month'
  const chartData = chartMode === 'week' ? statsData.revenueWeekly : statsData.revenueMonthly;
  const { kpi } = statsData;

  const recentOrders = dummyOrders.slice(0, 5);

  const statusColors = {
    'Đã giao':       'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    'Đang giao':     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    'Đang xử lý':   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    'Chờ xác nhận': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    'Đã huỷ':       'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black tracking-tight">
          Tổng quan <span className="font-light text-muted-foreground">FashionOS</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Cập nhật lúc 20:55 — Thứ Tư, 26/08/2026</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label={kpi.doanhThuThang.label} value={kpi.doanhThuThang.value} prev={kpi.doanhThuThang.prev}
          format={v => `${(v / 1_000_000).toFixed(1)}M đ`} icon={CreditCard} color="bg-emerald-500/10 text-emerald-600"
        />
        <KpiCard
          label={kpi.donHang.label} value={kpi.donHang.value} prev={kpi.donHang.prev}
          format={v => `${v} đơn`} icon={ShoppingCart} color="bg-blue-500/10 text-blue-600"
        />
        <KpiCard
          label={kpi.khachMoi.label} value={kpi.khachMoi.value} prev={kpi.khachMoi.prev}
          format={v => `${v} người`} icon={Users} color="bg-purple-500/10 text-purple-600"
        />
        <KpiCard
          label={kpi.tyLeHoan.label} value={kpi.tyLeHoan.value} prev={kpi.tyLeHoan.prev}
          format={v => `${v}%`} icon={Package} color="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts AreaChart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base">Biểu đồ doanh thu</h3>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
              <button onClick={() => setChartMode('week')} className={cn('px-3 py-1.5 transition-colors', chartMode === 'week' ? 'bg-foreground text-background' : 'hover:bg-muted')}>7 ngày</button>
              <button onClick={() => setChartMode('month')} className={cn('px-3 py-1.5 transition-colors', chartMode === 'month' ? 'bg-foreground text-background' : 'hover:bg-muted')}>12 tháng</button>
            </div>
          </div>
          <div className="mb-6">
            <span className="text-3xl font-black">
              {chartMode === 'week'
                ? `${statsData.revenueWeekly.reduce((s, d) => s + d.revenue, 0).toFixed(1)}M đ`
                : `${statsData.revenueMonthly.reduce((s, d) => s + d.revenue, 0).toFixed(1)}M đ`}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{chartMode === 'week' ? 'tuần này' : '12 tháng gần nhất'}</span>
          </div>
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis 
                  dataKey={chartMode === 'week' ? 'day' : 'month'} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} 
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base mb-4">Sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {statsData.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 group">
                <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                <img src={p.image} alt={p.name} className="w-9 h-11 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.sold} đã bán</p>
                </div>
                <p className="text-xs font-bold whitespace-nowrap">{(p.revenue / 1_000_000).toFixed(1)}M</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module Shortcuts + Recent + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Module Shortcuts */}
        <div className="xl:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base mb-4">Truy cập nhanh</h3>
          <div className="grid grid-cols-2 gap-2">
            {modules.map(mod => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.link}
                  to={mod.link}
                  className={cn('flex flex-col gap-2 p-3 rounded-xl border hover:shadow-sm transition-all group', mod.bg, mod.border)}
                >
                  <Icon size={18} className={cn(mod.color)} />
                  <p className="text-xs font-bold">{mod.title}</p>
                  <p className="text-[10px] text-muted-foreground">{mod.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Đơn hàng gần đây</h3>
              <Link to="/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">Xem tất cả <ArrowRight size={12} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái'].map(h => (
                      <th key={h} className="text-left pb-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.map((o, i) => (
                    <motion.tr
                      key={o.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <td className="py-3 text-xs font-mono font-bold">{o.id}</td>
                      <td className="py-3 text-xs font-medium">{o.customer}</td>
                      <td className="py-3 text-xs font-semibold">{o.total.toLocaleString('vi-VN')}đ</td>
                      <td className="py-3">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusColors[o.status])}>{o.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Activity + Low Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Activity Feed */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4">Hoạt động</h3>
              <div className="space-y-3">
                {statsData.recentActivities.slice(0, 5).map(act => {
                  const Icon = activityIcon[act.type] || Zap;
                  return (
                    <div key={act.id} className="flex items-start gap-2.5">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted', activityColor[act.type])}>
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug line-clamp-2">{act.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Sắp hết hàng
              </h3>
              <div className="space-y-3">
                {statsData.lowStock.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <img src={item.image} alt={item.name} className="w-8 h-10 object-cover rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.name}</p>
                      <p className="text-[10px] text-amber-600 font-bold">{item.stock} còn lại</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
