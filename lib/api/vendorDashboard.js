/**
 * Vendor Dashboard Statistics
 * Functions for fetching comprehensive dashboard metrics
 */

import api from './api';
import { handleAPIError } from './errorHandler';
import { retryRequest, createAuthHeaders, logRequestDetails, logResponseDetails } from './vendorUtils';

/**
 * Get comprehensive dashboard statistics including items, categories, orders, and revenue
 * @returns {Promise} API response with dashboard statistics
 */
export const getDashboardStats = async () => {
  const makeDashboardStatsRequest = async () => {
    logRequestDetails('Fetching dashboard statistics', '/vendor/dashboard-stats');
    
    // Get token and create headers
    const headers = await createAuthHeaders();
    console.info('🔑 Token available for dashboard stats request:', Object.keys(headers).length > 0 ? 'Yes' : 'No');
    
    const response = await api.get('/vendor/dashboard-stats', {
      timeout: 30000, // 30 seconds timeout
      headers
    });
    
    logResponseDetails('Dashboard stats fetch', response);
    return response.data;
  };

  try {
    return await retryRequest(makeDashboardStatsRequest, 3, 1000);
  } catch (error) {
    console.error('❌ Failed to fetch dashboard statistics after all retries:', error);
    console.error('❌ Dashboard stats error details:', {
      message: error.message,
      status: error.status
    });
    throw handleAPIError(error);
  }
};

/**
 * Parse dashboard stats response and return formatted data
 * @param {Object} statsResponse - Raw API response
 * @returns {Object} Formatted dashboard stats
 */
export const parseDashboardStats = (statsResponse) => {
  if (!statsResponse || !statsResponse.data) {
    console.warn('Invalid dashboard stats response structure');
    return {
      totalItems: 0,
      totalCategories: 0,
      ordersToday: 0,
      revenue: '₹0.00',
      walletBalance: 0,
      totalOrders: 0,
      todayRevenue: '0.00',
      totalCommission: '0.00',
      avgOrderValue: '0.00',
      pendingOrders: 0,
      vendorStatus: 'offline'
    };
  }

  const data = statsResponse.data;

  return {
    totalItems: data.total_items || 0,
    totalCategories: data.total_categories || 0,
    ordersToday: data.orders_today || 0,
    revenue: data.revenue || '₹0.00',
    walletBalance: data.wallet_balance || 0,
    totalOrders: data.total_orders || 0,
    todayRevenue: data.today_revenue || '0.00',
    totalCommission: data.total_commission || '0.00',
    avgOrderValue: data.average_order_value || '0.00',
    pendingOrders: data.pending_orders || 0,
    vendorStatus: data.vendor_status || 'offline'
  };
};
