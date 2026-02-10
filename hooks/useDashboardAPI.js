import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, parseDashboardStats } from '../lib/api/vendorDashboard';
import { getMenuItems } from '../lib/api/vendorMenuItems';
import { getMenuCategories } from '../lib/api/vendorMenu';

/**
 * Custom hook for fetching and managing dashboard statistics
 * Replaces the old useDashboardStats with API integration
 * @param {Object} options - Configuration options
 * @returns {Object} Dashboard stats, loading state, error state, and refresh function
 */
export const useDashboardAPI = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    onError = null
  } = options;

  const [stats, setStats] = useState({
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard stats from API
  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 Fetching dashboard statistics from API...');
      
      const response = await getDashboardStats();
      let parsedStats = parseDashboardStats(response);

      // Fallback: If API returns 0 counts, compute locally from menu endpoints
      let itemsCount = parsedStats.totalItems;
      let categoriesCount = parsedStats.totalCategories;

      const computeItemsCount = (data) => {
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        if (Array.isArray(data.data)) return data.data.length;
        if (Array.isArray(data.items)) return data.items.length;
        if (data.data && Array.isArray(data.data.data)) return data.data.data.length;
        if (Array.isArray(data.menu_items)) return data.menu_items.length;
        if (data.data && Array.isArray(data.data.items)) return data.data.items.length;
        return 0;
      };

      const computeCategoriesCount = (data) => {
        if (!data) return 0;
        if (Array.isArray(data)) return data.length;
        if (Array.isArray(data.data)) return data.data.length;
        if (data.data && Array.isArray(data.data.data)) return data.data.data.length;
        if (Array.isArray(data.categories)) return data.categories.length;
        if (data.data && Array.isArray(data.data.categories)) return data.data.categories.length;
        return 0;
      };

      try {
        if (!itemsCount || itemsCount === 0) {
          const itemsResp = await getMenuItems();
          itemsCount = computeItemsCount(itemsResp);
        }
      } catch {}

      try {
        if (!categoriesCount || categoriesCount === 0) {
          const categoriesResp = await getMenuCategories();
          categoriesCount = computeCategoriesCount(categoriesResp);
        }
      } catch {}

      parsedStats = {
        ...parsedStats,
        totalItems: itemsCount,
        totalCategories: categoriesCount,
      };

      setStats(parsedStats);
      setLastUpdated(new Date());
      
      console.log('✅ Dashboard stats fetched successfully:', parsedStats);
    } catch (err) {
      const errorMessage = err?.message || 'Failed to fetch dashboard statistics';
      console.error('❌ Error fetching dashboard stats:', errorMessage);
      
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchStats, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchStats]);

  // Manually refresh stats
  const refreshStats = useCallback(async () => {
    setLoading(true);
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    lastUpdated,
    totalItems: stats.totalItems,
    totalCategories: stats.totalCategories,
    ordersToday: stats.ordersToday,
    revenue: stats.revenue,
    walletBalance: stats.walletBalance
  };
};

export default useDashboardAPI;
