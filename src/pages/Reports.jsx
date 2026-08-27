import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { statsData } from '../utils/statsData';
import { dummyOrders, dummyProducts, dummyCustomers } from '../utils/dummyData';
import { TrendingUp, TrendingDown, CreditCard, ShoppingCart, Users, Package } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart as ReBarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

const catColors = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
const payColors = ['var(--color-primary)', '#3b82f6', '#ec4899', '#f59e0b'];

const CustomTooltip = ({ active, payload, label, suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
        <p className="font-bold text-sm mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('vi-VN') : entry.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [period, setPeriod] = useState('month');

  const totalRevenue = statsData.revenueMonthly.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = statsData.revenueMonthly.reduce((s, d) => s + d.orders, 0);
  const avgOrder     = totalRevenue / totalOrders * 1_000_000;

  const summaryKpis = [
    { label: 'Tổng doanh thu (12 tháng)', value: `${totalRevenue.toFixed(1)}M đ`, icon: CreditCard, trend: '+17.9%', up: true, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Tổng đơn hàng',             value: `${totalOrders} đơn`,             icon: ShoppingCart, trend: '+18.3%', up: true, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Giá trị đơn TB',            value: `${(avgOrder / 1000).toFixed(0)}K đ`, icon: Package,  trend: '-0.4%',  up: false, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Khách hàng',                value: `${dummyCustomers.length} người`,  icon: Users,       trend: '+31%',   up: true, color: 'bg-purple-500/10 text-purple-600' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thống kê & Báo cáo</h1>
          <p className="text-muted-foreground text-sm mt-1">Tổng hợp dữ liệu kinh doanh FashionOS</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
          {['week', 'month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-4 py-2 transition-colors', period === p ? 'bg-foreground text-background' : 'hover:bg-muted')}>
              {p === 'week' ? '7 ngày' : p === 'month' ? '12 tháng' : 'Tất cả'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryKpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', k.color)}>
                  <Icon size={15} />
                </div>
              </div>
              <p className="text-xl font-black mb-1">{k.value}</p>
              <span className={cn('text-xs font-semibold flex items-center gap-0.5', k.up ? 'text-emerald-600' : 'text-red-500')}>
                {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{k.trend} so với năm trước
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue & Orders Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue (Area Chart) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold mb-1">Doanh thu theo tháng</h3>
          <p className="text-xs text-muted-foreground mb-4">12 tháng gần nhất (triệu đồng)</p>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData.revenueMonthly} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.6 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.6 }} dx={-10} />
                <Tooltip content={<CustomTooltip suffix="M đ" />} />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Orders (Bar Chart) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold mb-1">Đơn hàng theo tháng</h3>
          <p className="text-xs text-muted-foreground mb-4">Số lượng đơn hàng</p>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={statsData.revenueMonthly} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.6 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, opacity: 0.6 }} dx={-10} />
                <Tooltip content={<CustomTooltip suffix=" đơn" />} />
                <Bar dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category + Payment + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Revenue (Pie Chart) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold mb-4">Doanh thu theo danh mục</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.categoryRevenue}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={85}
                  paddingAngle={5}
                  dataKey="revenue"
                >
                  {statsData.categoryRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={catColors[index % catColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip suffix="M đ" />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods (Pie Chart) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold mb-4">Phương thức thanh toán</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.paymentMethods}
                  cx="50%" cy="50%"
                  outerRadius={85}
                  dataKey="count"
                >
                  {statsData.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={payColors[index % payColors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip suffix=" GD" />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">Top 5 sản phẩm</h3>
          <div className="space-y-4">
            {statsData.topProducts.map((p, i) => {
              const maxSold = statsData.topProducts[0].sold;
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <img src={p.image} alt={p.name} className="w-7 h-8 object-cover rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.sold} bán · {(p.revenue / 1_000_000).toFixed(1)}M đ</p>
                    </div>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${(p.sold / maxSold) * 100}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.1 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Detail Table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold mb-4">Doanh thu 7 ngày gần nhất</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border">
                {['Ngày', 'Doanh thu', 'Đơn hàng', 'Đơn TB', 'So ngày trước'].map(h => (
                  <th key={h} className="text-left pb-3 text-xs font-bold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {statsData.revenueWeekly.map((d, i) => {
                const prev = statsData.revenueWeekly[i - 1];
                const diff = prev ? ((d.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) : null;
                return (
                  <motion.tr key={d.day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}>
                    <td className="py-3 font-bold">{d.day}</td>
                    <td className="py-3 font-semibold">{d.revenue.toFixed(1)}M đ</td>
                    <td className="py-3">{d.orders} đơn</td>
                    <td className="py-3 text-muted-foreground">{((d.revenue * 1_000_000) / d.orders / 1000).toFixed(0)}K đ</td>
                    <td className="py-3">
                      {diff !== null && (
                        <span className={cn('text-xs font-semibold flex items-center gap-0.5', parseFloat(diff) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {parseFloat(diff) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {diff}%
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
