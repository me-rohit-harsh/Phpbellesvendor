import { useEffect, useCallback } from 'react';
import fcmService from '../lib/notifications/fcmService';
import { ToastManager } from '../app/components/NotificationToast';
import { router } from 'expo-router';

/**
 * Custom hook for managing FCM push notifications
 * @param {Object} options - Hook options
 * @param {boolean} options.autoRegister - Auto register for notifications on mount
 * @param {Function} options.onNotificationReceived - Custom handler for received notifications
 * @param {Function} options.onNotificationTapped - Custom handler for tapped notifications
 * @returns {Object} FCM hook utilities
 */
export const useFCMNotifications = ({
  autoRegister = true,
  onNotificationReceived = null,
  onNotificationTapped = null
} = {}) => {
  
  /**
   * Handle notification received (app in foreground)
   */
  const handleNotificationReceived = useCallback((notification) => {
    const { title, body, data } = notification.request.content;
    
    console.info('📱 Notification received:', { title, body, data });

    // Show in-app toast notification
    ToastManager.info(`${title}: ${body}`, 5000);

    // Call custom handler if provided
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }

    // Handle different notification types
    if (data?.type) {
      handleNotificationByType(data.type, data);
    }
  }, [onNotificationReceived]);

  /**
   * Handle notification tapped (user interaction)
   */
  const handleNotificationTapped = useCallback((response) => {
    const { title, body, data } = response.notification.request.content;
    
    console.info('👆 Notification tapped:', { title, body, data });

    // Call custom handler if provided
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }

    // Navigate based on notification type
    if (data?.type) {
      navigateToScreen(data.type, data);
    }
  }, [onNotificationTapped]);

  /**
   * Handle notification based on type
   */
  const handleNotificationByType = (type, data) => {
    switch (type) {
      case 'new_order':
        // Handle new order notification
        console.info('🛒 New order received:', data.orderId);
        break;
      
      case 'order_update':
        // Handle order update notification
        console.info('📦 Order updated:', data.orderId);
        break;
      
      case 'verification_complete':
        // Handle verification complete notification
        console.info('✅ Verification complete');
        ToastManager.success('Your vendor account has been verified!', 6000);
        break;
      
      case 'menu_approved':
        // Handle menu approval notification
        console.info('📋 Menu approved');
        ToastManager.success('Your menu has been approved!', 5000);
        break;

      case 'alert':
        // Handle important alerts
        console.info('⚠️ Important alert:', data.message);
        ToastManager.warning(data.message || 'Important notification', 6000);
        break;

      default:
        console.info('📬 Generic notification:', type);
        break;
    }
  };

  /**
   * Navigate to appropriate screen based on notification type
   */
  const navigateToScreen = (type, data) => {
    try {
      switch (type) {
        case 'new_order':
        case 'order_update':
          // Navigate to orders screen if it exists
          router.push('/business/analytics');
          break;
        
        case 'verification_complete':
          // Navigate to profile
          router.push('/business/profile');
          break;
        
        case 'menu_approved':
          // Navigate to menu
          router.push('/business/menu');
          break;

        case 'alert':
          // Stay on current screen or go to dashboard
          router.push('/home');
          break;

        default:
          // Navigate to home
          router.push('/home');
          break;
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  /**
   * Register for notifications
   */
  const registerForNotifications = useCallback(async () => {
    try {
      const token = await fcmService.registerForPushNotifications();
      if (token) {
        console.info('✅ FCM registration successful');
        return token;
      } else {
        console.warn('⚠️ FCM registration failed');
        return null;
      }
    } catch (error) {
      console.error('❌ Error registering for notifications:', error);
      return null;
    }
  }, []);

  /**
   * Setup listeners on mount
   */
  useEffect(() => {
    let isSubscribed = true;

    const initialize = async () => {
      if (autoRegister && isSubscribed) {
        await registerForNotifications();
      }

      // Setup notification listeners
      fcmService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationTapped
      );
    };

    initialize();

    // Cleanup on unmount
    return () => {
      isSubscribed = false;
      fcmService.removeNotificationListeners();
    };
  }, [autoRegister, handleNotificationReceived, handleNotificationTapped]);

  /**
   * Get FCM token
   */
  const getFCMToken = useCallback(async () => {
    return await fcmService.getFCMToken();
  }, []);

  /**
   * Show local notification (for testing)
   */
  const showLocalNotification = useCallback(async (title, body, data = {}) => {
    await fcmService.showLocalNotification({ title, body, data });
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    await fcmService.clearAllNotifications();
  }, []);

  return {
    registerForNotifications,
    getFCMToken,
    showLocalNotification,
    clearAllNotifications,
  };
};

export default useFCMNotifications;
