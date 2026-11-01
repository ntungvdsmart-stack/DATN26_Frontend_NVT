import axiosClient from './axiosClient';

const statsApi = {
  getKPIs: () => axiosClient.get('/stats/kpi'),
  getRevenueChart: (mode = 'week') => axiosClient.get(`/stats/revenue?mode=${mode}`),
  getTopProducts: channel => axiosClient.get('/stats/top-products', { params: { channel: channel || undefined } }),
  getCategoryStats: () => axiosClient.get('/stats/category'),
  getPaymentStats: () => axiosClient.get('/stats/payments'),
  getChannelStats: () => axiosClient.get('/stats/channel'),
  getStaffDailyStats: () => axiosClient.get('/stats/staff-daily'),
};

export default statsApi;
