import axiosClient from './axiosClient';

const inventoryApi = {
  receiveStock: (item, quantity, reason) => axiosClient.post(`/inventory/variants/${item.variant_id}/branches/${item.branch_id}/receive`, { quantity, reason }),
  getInventory: (branchId) => {
    return axiosClient.get('/inventory', { params: { branch_id: branchId } });
  },
  updateQuantity: (inventoryId, quantity, reason, expectedQuantity, item) => {
    const path = inventoryId ? `/inventory/${inventoryId}` : `/inventory/variants/${item.variant_id}/branches/${item.branch_id}`;
    return axiosClient.put(path, { quantity, reason, expected_quantity: expectedQuantity });
  }
};

export default inventoryApi;
