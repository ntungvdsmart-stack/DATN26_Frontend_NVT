// ─── STATISTICS HARDCODE ────────────────────────────────────────────────────

export const statsData = {
  // KPI Cards
  kpi: {
    doanhThuThang: { value: 48_600_000, prev: 41_200_000, label: 'Doanh thu tháng 8' },
    donHang:       { value: 143,        prev: 121,         label: 'Đơn hàng tháng này' },
    khachMoi:      { value: 38,         prev: 29,          label: 'Khách hàng mới' },
    tyLeHoan:      { value: 2.4,        prev: 3.1,         label: 'Tỷ lệ hoàn hàng (%)' },
  },

  // Revenue last 12 months (triệu đồng)
  revenueMonthly: [
    { month: 'T9/25',  revenue: 28.4, orders: 84 },
    { month: 'T10/25', revenue: 31.2, orders: 92 },
    { month: 'T11/25', revenue: 38.7, orders: 115 },
    { month: 'T12/25', revenue: 52.1, orders: 158 },
    { month: 'T1/26',  revenue: 34.5, orders: 103 },
    { month: 'T2/26',  revenue: 29.8, orders: 88  },
    { month: 'T3/26',  revenue: 36.3, orders: 109 },
    { month: 'T4/26',  revenue: 41.0, orders: 124 },
    { month: 'T5/26',  revenue: 43.2, orders: 131 },
    { month: 'T6/26',  revenue: 39.6, orders: 118 },
    { month: 'T7/26',  revenue: 45.8, orders: 138 },
    { month: 'T8/26',  revenue: 48.6, orders: 143 },
  ],

  // Revenue last 7 days (triệu đồng)
  revenueWeekly: [
    { day: 'T2', revenue: 5.8,  orders: 17 },
    { day: 'T3', revenue: 8.2,  orders: 25 },
    { day: 'T4', revenue: 6.4,  orders: 19 },
    { day: 'T5', revenue: 9.5,  orders: 29 },
    { day: 'T6', revenue: 7.1,  orders: 21 },
    { day: 'T7', revenue: 11.6, orders: 35 },
    { day: 'CN', revenue: 9.2,  orders: 28 },
  ],

  // Top selling products
  topProducts: [
    { id: 'P001', name: 'Áo Thun Cotton Cổ Tròn',    sold: 312, revenue: 62_088_000,  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&q=80' },
    { id: 'P008', name: 'Túi Tote Canvas Minimalist', sold: 278, revenue: 69_322_000,  image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&q=80' },
    { id: 'P005', name: 'Giày Sneaker Cổ Thấp',       sold: 201, revenue: 170_850_000, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=80&q=80' },
    { id: 'P028', name: 'Áo Thun Oversize In Chữ',    sold: 198, revenue: 45_342_000,  image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=80&q=80' },
    { id: 'P015', name: 'Balo Da Nappa Nhỏ Gọn',      sold: 156, revenue: 121_680_000, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=80&q=80' },
  ],

  // Revenue by category
  categoryRevenue: [
    { name: 'Áo thun',   revenue: 98.4,  percent: 26 },
    { name: 'Quần',      revenue: 72.1,  percent: 19 },
    { name: 'Giày',      revenue: 85.6,  percent: 22 },
    { name: 'Túi xách',  revenue: 61.3,  percent: 16 },
    { name: 'Áo khoác',  revenue: 44.2,  percent: 12 },
    { name: 'Phụ kiện',  revenue: 18.9,  percent: 5  },
  ],

  // Payment methods
  paymentMethods: [
    { name: 'Chuyển khoản', count: 89, percent: 42 },
    { name: 'VNPay',        count: 64, percent: 30 },
    { name: 'Momo',         count: 42, percent: 20 },
    { name: 'Tiền mặt',    count: 17, percent: 8  },
  ],

  // Recent activities (for dashboard)
  recentActivities: [
    { id: 'ORD-1025', type: 'order',    message: 'Đơn hàng mới từ Nguyễn Thị Ngọc Ánh',  time: '2 phút trước',  amount: 940000 },
    { id: 'C022',     type: 'customer', message: 'Khách hàng mới: Tống Văn Long',          time: '15 phút trước', amount: null },
    { id: 'ORD-1024', type: 'order',    message: 'Đơn #ORD-1024 đã được giao thành công', time: '28 phút trước', amount: 520000 },
    { id: 'ORD-1023', type: 'ship',     message: 'Đơn #ORD-1023 đang giao tới khách',     time: '45 phút trước', amount: null },
    { id: 'P030',     type: 'stock',    message: 'Giày Boot Chelsea sắp hết hàng (18 cái)', time: '1 giờ trước',   amount: null },
    { id: 'C021',     type: 'customer', message: 'Khách hàng mới: Phùng Thị Hà',           time: '2 giờ trước',   amount: null },
    { id: 'ORD-1022', type: 'order',    message: 'Đơn hàng mới từ Tống Văn Long',          time: '3 giờ trước',   amount: 860000 },
  ],

  // Low stock alerts
  lowStock: [
    { id: 'P030', name: 'Giày Boot Chelsea Da Bò',    stock: 18, image: 'https://images.unsplash.com/photo-1608256246200-de6d273b9496?w=60&q=80' },
    { id: 'P016', name: 'Áo Blazer Oversize Nhung',   stock: 22, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b90e4?w=60&q=80' },
    { id: 'P022', name: 'Chân Váy Bút Chì Công Sở',  stock: 24, image: 'https://images.unsplash.com/photo-1511903978965-bf8272ca0c0a?w=60&q=80' },
    { id: 'P011', name: 'Đầm Suông Linen Midi',       stock: 27, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=60&q=80' },
    { id: 'P024', name: 'Túi Clutch Da Rắn Vân',      stock: 28, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=60&q=80' },
  ],
};
