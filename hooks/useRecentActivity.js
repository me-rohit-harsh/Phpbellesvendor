import { useState, useEffect, useCallback, useRef } from 'react';
import { getRecentActivities } from '../lib/api/vendor';

/**
 * Custom hook for managing recent activity data with real-time updates
 * @param {Object} options - Configuration options
 * @param {number} options.refreshInterval - Auto-refresh interval in milliseconds (default: 30000)
 * @param {number} options.limit - Maximum number of activities to fetch (default: 10)
 * @param {boolean} options.autoRefresh - Enable automatic refresh (default: true)
 * @returns {Object} Activity data and control functions
 */
export const useRecentActivity = (options = {}) => {
  const {
    refreshInterval = 30000, // 30 seconds
    limit = 10,
    autoRefresh = true
  } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Activity type configurations with icons and colors
  const activityTypes = {
    order_received: {
      icon: 'checkmark-circle',
      color: '#4ECDC4',
      title: 'New order received'
    },
    order_completed: {
      icon: 'checkmark-done-circle',
      color: '#10B981',
      title: 'Order completed'
    },
    order_cancelled: {
      icon: 'close-circle',
      color: '#EF4444',
      title: 'Order cancelled'
    },
    menu_item_added: {
      icon: 'add-circle',
      color: '#45B7D1',
      title: 'Menu item added'
    },
    menu_item_updated: {
      icon: 'create-outline',
      color: '#8B5CF6',
      title: 'Menu item updated'
    },
    menu_item_deleted: {
      icon: 'trash-outline',
      color: '#EF4444',
      title: 'Menu item removed'
    },
    category_added: {
      icon: 'folder-outline',
      color: '#F59E0B',
      title: 'Category added'
    },
    status_changed: {
      icon: 'swap-horizontal',
      color: '#6B7280',
      title: 'Status changed'
    },
    sales_milestone: {
      icon: 'trending-up',
      color: '#F7DC6F',
      title: 'Sales milestone reached'
    },
    stock_updated: {
      icon: 'cube-outline',
      color: '#84CC16',
      title: 'Stock updated'
    },
    offer_created: {
      icon: 'gift-outline',
      color: '#EC4899',
      title: 'Offer created'
    },
    profile_updated: {
      icon: 'person-outline',
      color: '#6366F1',
      title: 'Profile updated'
    }
  };

  // Format activity data with proper icons and colors
  const formatActivity = useCallback((activity) => {
    const type = activityTypes[activity.type] || activityTypes.order_received;
    
    return {
      id: activity.id || Date.now() + Math.random(),
      type: activity.type,
      title: activity.title || type.title,
      description: activity.description || '',
      time: activity.time || activity.created_at || new Date().toISOString(),
      icon: activity.icon || type.icon,
      color: activity.color || type.color,
      metadata: activity.metadata || {}
    };
  }, [activityTypes]);

  // Log activity fetch attempts for debugging
  const logActivityFetch = useCallback((message, data = null) => {
    console.log(`[Recent Activity] ${message}`, data ? data : '');
  }, []);

  // Fetch activities from API
  const fetchActivities = useCallback(async (loadingType = 'visible') => {
    if (!mountedRef.current) return;

    try {
      if (loadingType === 'visible') {
        setLoading(true);
      } else if (loadingType === 'background') {
        setBackgroundLoading(true);
      }
      setError(null);

      logActivityFetch('Fetching activities from API...', { limit });

      const response = await getRecentActivities({ limit });
      
      if (response && response.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
          const formattedActivities = response.data.map(formatActivity);
          setActivities(formattedActivities);
          setLastUpdated(new Date());
          logActivityFetch('Activities loaded successfully', { count: formattedActivities.length });
        } else {
          // API returned empty array - no activities available
          setActivities([]);
          setLastUpdated(new Date());
          logActivityFetch('No activities found from API');
        }
      } else {
        throw new Error('Invalid API response format');
      }

    } catch (error) {
      console.error('Error fetching activities:', error);
      logActivityFetch('Failed to fetch activities', error.message);
      
      if (mountedRef.current) {
        setError(error.message || 'Failed to load activities');
        // Don't set empty activities on error - keep previous data if available
        if (activities.length === 0) {
          setActivities([]);
        }
      }
    } finally {
      if (mountedRef.current) {
        if (loadingType === 'visible') {
          setLoading(false);
        } else if (loadingType === 'background') {
          setBackgroundLoading(false);
        }
      }
    }
  }, [limit, formatActivity, logActivityFetch, activities.length]);

  // Manual refresh function
  const refreshActivities = useCallback(() => {
    fetchActivities('visible');
  }, [fetchActivities]);

  // Add new activity (for real-time updates)
  const addActivity = useCallback((newActivity) => {
    if (!mountedRef.current) return;

    const formattedActivity = formatActivity(newActivity);
    setActivities(prev => [formattedActivity, ...prev.slice(0, limit - 1)]);
    setLastUpdated(new Date());
  }, [formatActivity, limit]);

  // Format relative time
  const getRelativeTime = useCallback((timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    // Initial load - only show loading if no activities exist
    const initialLoadType = activities.length === 0 ? 'visible' : 'background';
    fetchActivities(initialLoadType);

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchActivities('background'); // Silent background refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchActivities, autoRefresh, refreshInterval, activities.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    activities,
    loading,
    backgroundLoading,
    error,
    lastUpdated,
    refreshActivities,
    addActivity,
    getRelativeTime,
    activityTypes
  };
};

export default useRecentActivity;