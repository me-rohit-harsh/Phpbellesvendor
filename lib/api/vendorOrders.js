import api from './api';

export const getVendorOrders = async () => {
  const res = await api.get('/vendor/orders');
  return res.data;
};

export const getVendorOrder = async (id) => {
  const res = await api.get(`/vendor/orders/${id}`);
  return res.data;
};

export const acceptVendorOrder = async (id) => {
  const res = await api.post(`/vendor/orders/${id}/accept`);
  return res.data;
};

export const rejectVendorOrder = async (id, reason) => {
  const payload = reason ? { reason } : {};
  try {
    const res = await api.post(`/vendor/orders/${id}/reject`, payload);
    return res.data;
  } catch (e1) {
    try {
      const res = await api.post(`/vendor/orders/reject/${id}`, payload);
      return res.data;
    } catch (e2) {
      const res = await api.post(`/vendor/orders/${id}/rejected`, payload);
      return res.data;
    }
  }
};

export const readyForPickup = async (id) => {
  const res = await api.post(`/vendor/orders/${id}/ready-for-pickup`);
  return res.data;
};

export default {
  getVendorOrders,
  getVendorOrder,
  acceptVendorOrder,
  rejectVendorOrder,
  readyForPickup,
};