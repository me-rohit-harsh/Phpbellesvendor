import api from './api';

// Get wallet balance
export const getWalletBalance = async () => {
  const res = await api.get('/vendor/wallet/balance');
  return res.data;
};

// Get earnings summary for a period
export const getEarningsSummary = async (period = 'today') => {
  const res = await api.get(`/vendor/wallet/earnings-summary?period=${period}`);
  return res.data;
};

// Get transaction history with pagination
export const getTransactionHistory = async (page = 1, limit = 20) => {
  const res = await api.get(`/vendor/wallet/transactions?page=${page}&limit=${limit}`);
  return res.data;
};

// Get payout history with pagination
export const getPayoutHistory = async (page = 1, limit = 20) => {
  const res = await api.get(`/vendor/wallet/payouts?page=${page}&limit=${limit}`);
  return res.data;
};

// Get bank details
export const getBankDetails = async () => {
  const res = await api.get('/vendor/wallet/bank-details');
  return res.data;
};

// Update bank details
export const updateBankDetails = async (bankDetails) => {
  const res = await api.post('/vendor/wallet/bank-details', bankDetails);
  return res.data;
};

// Request payout
export const requestPayout = async (amount) => {
  const res = await api.post('/vendor/wallet/payout-request', { amount });
  return res.data;
};

export default {
  getWalletBalance,
  getEarningsSummary,
  getTransactionHistory,
  getPayoutHistory,
  getBankDetails,
  updateBankDetails,
  requestPayout,
};
