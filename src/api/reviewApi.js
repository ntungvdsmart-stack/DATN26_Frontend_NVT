import axiosClient from './axiosClient';

const reviewApi = {
  getProductReviews: (productId) => {
    return axiosClient.get(`/reviews/products/${productId}`);
  },
  checkCanReview: (productId) => {
    return axiosClient.get(`/reviews/products/${productId}/can-review`);
  },
  createReview: (productId, data) => {
    return axiosClient.post(`/reviews/products/${productId}`, data);
  }
};

export default reviewApi;
