import axiosClient from './axiosClient';

const wishlistApi = {
  get: () => axiosClient.get('/wishlist'),
  toggle: (variant_id) => axiosClient.post('/wishlist/toggle', { variant_id })
};

export default wishlistApi;
