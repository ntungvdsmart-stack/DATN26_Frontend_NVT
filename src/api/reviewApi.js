import axiosClient from './axiosClient';

const reviewApi = {
  updateReview: (id, data) => axiosClient.put(`/reviews/${id}`, data),
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`),
  getProductReviews: (productId, page = 1) => {
    return axiosClient.get(`/reviews/products/${productId}`, { params: { page } });
  },
  checkCanReview: (productId) => {
    return axiosClient.get(`/reviews/products/${productId}/can-review`);
  },
  createReview: (productId, data) => {
    return axiosClient.post(`/reviews/products/${productId}`, data);
  }
};

export default reviewApi;
