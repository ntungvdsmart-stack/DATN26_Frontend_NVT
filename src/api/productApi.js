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
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return axiosClient.post('/products/upload-images', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
  },

  // Upload ảnh từ URL thẳng lên Cloudinary
  uploadImageUrl: (url) => axiosClient.post('/products/upload-image-url', { url }),

  getAttributes: () => axiosClient.get('/products/attributes/all'),
  createCategory: (data) => axiosClient.post('/products/attributes/categories', data),
  updateCategory: (id, data) => axiosClient.put(`/products/attributes/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/products/attributes/categories/${id}`),
  createBrand: (data) => axiosClient.post('/products/attributes/brands', data),
  updateBrand: (id, data) => axiosClient.put(`/products/attributes/brands/${id}`, data),
  deleteBrand: (id) => axiosClient.delete(`/products/attributes/brands/${id}`),

  createSize: (data) => axiosClient.post('/products/attributes/sizes', data),
  updateSize: (id, data) => axiosClient.put(`/products/attributes/sizes/${id}`, data),
  deleteSize: (id) => axiosClient.delete(`/products/attributes/sizes/${id}`),

  createColor: (data) => axiosClient.post('/products/attributes/colors', data),
  updateColor: (id, data) => axiosClient.put(`/products/attributes/colors/${id}`, data),
  deleteColor: (id) => axiosClient.delete(`/products/attributes/colors/${id}`),

  createMaterial: (data) => axiosClient.post('/products/attributes/materials', data),
  updateMaterial: (id, data) => axiosClient.put(`/products/attributes/materials/${id}`, data),
  deleteMaterial: (id) => axiosClient.delete(`/products/attributes/materials/${id}`),

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
