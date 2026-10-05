import axiosClient from './axiosClient';

const inventoryApi = {
  getInventory: (branchId) => {
    return axiosClient.get('/inventory', { params: { branch_id: branchId } });
  },
  updateQuantity: (inventoryId, quantity, reason) => {
    return axiosClient.put(`/inventory/${inventoryId}`, { quantity, reason });
  }
};

export default inventoryApi;
