import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * FCM Service for managing push notifications
 */
class FCMService {
  constructor() {
    this.fcmToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Ensure Android notification channels exist with sound and vibration
   */
  async configureAndroidChannels() {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Important Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });

      // Match backend payload channel_id used in API
      await Notifications.setNotificationChannelAsync('high_importance_channel', {
        name: 'High Importance',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        sound: 'default',
      });
    } catch (e) {
      console.warn('Failed to configure Android channels:', e?.message);
    }
  }

  /**
   * Register for push notifications and get FCM token
   * @returns {Promise<string|null>} FCM token or null if registration fails
   */
  async registerForPushNotifications() {
    try {
      // Check if device is physical (push notifications don't work on simulator/emulator)
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get device push token (prefer native FCM/APNs) and fall back to Expo token
      let token = null;
      let source = 'unknown';

      try {
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        if (devicePushToken?.data) {
          token = devicePushToken.data;
          source = devicePushToken.type || 'device'; // 'fcm' on Android, 'apns' on iOS
        }
      } catch (e) {
        console.warn('Failed to get native device push token, will try Expo token:', e?.message);
      }

      if (!token) {
        const expoTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = expoTokenData?.data || null;
        source = 'expo';
      }

      this.fcmToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', this.fcmToken);
      await AsyncStorage.setItem('fcm_token_source', source);
      
      console.info('✅ Push token registered:', { source, token: this.fcmToken });

      // Configure notification channels for Android
      await this.configureAndroidChannels();

      return this.fcmToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Get FCM token (retrieve from memory or AsyncStorage)
   * @returns {Promise<string|null>} FCM token
   */
  async getFCMToken() {
    if (this.fcmToken) {
      return this.fcmToken;
    }

    // Try to get from AsyncStorage
    const storedToken = await AsyncStorage.getItem('fcm_token');
    if (storedToken) {
      this.fcmToken = storedToken;
      return storedToken;
    }

    // Register if no token exists
    return await this.registerForPushNotifications();
  }

  /**
   * Get app identifier (bundle ID / package name)
   * @returns {string} App identifier
   */
  getAppIdentifier() {
    return Constants.expoConfig?.ios?.bundleIdentifier || 
           Constants.expoConfig?.android?.package || 
           'com.shashankgupta01.phpbellforbusiness';
  }

  /**
   * Setup notification listeners
   * @param {Function} onNotificationReceived - Callback when notification is received (app in foreground)
   * @param {Function} onNotificationTapped - Callback when notification is tapped
   */
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.info('📱 Notification received (foreground):', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.info('👆 Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    console.info('✅ Notification listeners registered');
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      try {
        if (typeof this.notificationListener.remove === 'function') {
          this.notificationListener.remove();
        } else if (
          typeof Notifications.removeNotificationSubscription === 'function'
        ) {
          Notifications.removeNotificationSubscription(this.notificationListener);
        }
      } catch (e) {
        console.warn('Failed to remove notification listener:', e);
      }
      this.notificationListener = null;
    }
    if (this.responseListener) {
      try {
        if (typeof this.responseListener.remove === 'function') {
          this.responseListener.remove();
        } else if (
          typeof Notifications.removeNotificationSubscription === 'function'
        ) {
          Notifications.removeNotificationSubscription(this.responseListener);
        }
      } catch (e) {
        console.warn('Failed to remove response listener:', e);
      }
      this.responseListener = null;
    }
    console.info('🗑️ Notification listeners removed');
  }

  /**
   * Show local notification (for testing or immediate display)
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Object} options.data - Additional data
   */
  async showLocalNotification({ title, body, data = {} }) {
    try {
      // Ensure channels exist (safe to call multiple times)
      await this.configureAndroidChannels();

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'default',
        },
        trigger: null, // Show immediately
      });
      console.info('✅ Local notification shown');
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    console.info('🧹 All notifications cleared');
  }

  /**
   * Get notification badge count (iOS)
   */
  async getBadgeCount() {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  }

  /**
   * Set notification badge count (iOS)
   * @param {number} count - Badge count
   */
  async setBadgeCount(count) {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  /**
   * Clear FCM token (on logout)
   */
  async clearFCMToken() {
    this.fcmToken = null;
    await AsyncStorage.removeItem('fcm_token');
    await AsyncStorage.removeItem('fcm_token_source');
    console.info('🗑️ FCM token cleared');
  }
}

// Export singleton instance
export default new FCMService();
