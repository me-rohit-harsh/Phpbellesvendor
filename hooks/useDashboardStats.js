import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getMenuItems, getMenuCategories } from '../lib/api/vendor';

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCategories: 0,
    ordersToday: 12, // Static for now
    revenue: '₹2,450', // Static for now
    activeOffers: 3 // Static for now
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      
  
      
      // Fetch data in parallel
      const [itemsResponse, categoriesResponse] = await Promise.all([
        getMenuItems(),
        getMenuCategories()
      ]);

      const totalItems = itemsResponse?.data?.length || 0;
      const totalCategories = categoriesResponse?.length || 0;
      


      setStats(prevStats => ({
        ...prevStats,
        totalItems,
        totalCategories
      }));
    } catch (error) {

      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(() => {

    fetchStats();
  }, [fetchStats]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {

      fetchStats();
    }, [fetchStats])
  );

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 30 seconds when app is active
  useEffect(() => {
    const interval = setInterval(() => {

      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    statsLoading,
    statsError,
    refreshStats
  };
};