import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, parseDashboardStats } from '../lib/api/vendorDashboard';

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
      const parsedStats = parseDashboardStats(response);
      
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
