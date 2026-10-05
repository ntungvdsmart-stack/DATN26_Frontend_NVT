import axiosClient from './axiosClient';

const userApi = {
  getProfile: () => {
    return axiosClient.get('/customers/me');
  },
  updateProfile: (data) => {
    return axiosClient.put('/customers/me', data);
  },
  changePassword: (data) => {
    return axiosClient.put('/customers/me/password', data);
  },
  getMyOrders: () => {
    return axiosClient.get('/customers/me/orders');
  },
  getMyOrderDetail: (orderId) => {
    return axiosClient.get(`/customers/me/orders/${orderId}`);
  }
};

export default userApi;
