import api from '../../../lib/api/api';

export const getCoupons = async () => {
  const res = await api.get('/vendor/coupons');
  return res.data;
};

export const getCouponById = async (id) => {
  const res = await api.get(`/vendor/coupons/${id}`);
  return res.data;
};

export const createCoupon = async (data) => {
  const res = await api.post('/vendor/coupons', data);
  return res.data;
};

export const updateCoupon = async (id, data) => {
  const res = await api.put(`/vendor/coupons/${id}`, data);
  return res.data;
};

export const deleteCoupon = async (id) => {
  const res = await api.delete(`/vendor/coupons/${id}`);
  return res.data;
};

export default {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};