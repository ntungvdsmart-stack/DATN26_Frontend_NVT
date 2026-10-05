import axiosClient from './axiosClient';

const customerApi = {
  getAllCustomers: () => axiosClient.get('/customers'),
  getCustomerById: (id) => axiosClient.get(`/customers/${id}`),
  createCustomer: (data) => axiosClient.post('/customers', data),
  updateStatus: (id, is_active) => axiosClient.patch(`/customers/${id}/status`, { is_active })
};

export default customerApi;
