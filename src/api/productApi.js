import axiosClient from './axiosClient';

const productApi = {
  // ── Danh sách & chi tiết (Admin) ──────────────────────────────
  getAllAdmin: () => axiosClient.get('/products/admin/all'),
  getByIdAdmin: (id) => axiosClient.get(`/products/admin/${id}`),
  
  // ── Danh sách & chi tiết (Public Storefront) ──────────────────
  getAllPublic: () => axiosClient.get('/products'),
  getByIdPublic: (id) => axiosClient.get(`/products/${id}`),

  getFormAttributes: () => axiosClient.get('/products/attributes/all'),

  // ── Upload ảnh từ máy local (multipart/form-data) ──────────────
  // files: FileList hoặc Array<File>
  // onProgress: callback(percent) để hiển thị progress bar
  uploadImages: (files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    return axiosClient.post('/products/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  // ── CRUD ──────────────────────────────────────────────────────
  // payload = { product: {...}, variants: [...], images: [...] }
  create: (payload) => axiosClient.post('/products', payload),
  update: (id, payload) => axiosClient.put(`/products/${id}`, payload),
  delete: (id) => axiosClient.delete(`/products/${id}`),

  // Xóa riêng 1 biến thể
  deleteVariant: (productId, variantId) =>
    axiosClient.delete(`/products/${productId}/variants/${variantId}`),

  // Bật/Tắt trạng thái bán
  toggleStatus: (id, isActive) =>
    axiosClient.patch(`/products/${id}/status`, { is_active: isActive }),
};

export default productApi;
