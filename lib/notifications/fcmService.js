import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

let cachedMessagingModule;

const getMessagingModule = () => {
  if (cachedMessagingModule !== undefined) {
    return cachedMessagingModule;
  }

  try {
    const firebaseMessaging = require('@react-native-firebase/messaging');
    cachedMessagingModule = firebaseMessaging?.default || firebaseMessaging;
  } catch (error) {
    console.warn('Firebase Messaging native module is unavailable in this build:', error?.message);
    cachedMessagingModule = null;
  }

  return cachedMessagingModule;
};

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
    this.tokenListener = null;
    this.messageListener = null;
    this.openedAppListener = null;
    this.registrationPromise = null;
  }

  isExpoPushToken(token) {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  }

  getMessaging() {
    return getMessagingModule();
  }

  isMessagingSupported() {
    return typeof this.getMessaging() === 'function';
  }

  isLikelyApnsToken(token) {
    return typeof token === 'string' && /^[a-f0-9]{64,}$/i.test(token);
  }

  isValidServerPushToken(token) {
    if (typeof token !== 'string') return false;

    const trimmedToken = token.trim();
    if (!trimmedToken || this.isExpoPushToken(trimmedToken) || this.isLikelyApnsToken(trimmedToken)) {
      return false;
    }

    return trimmedToken.length > 20;
  }

  async ensureMessagingReady() {
    if (Platform.OS === 'web') {
      return false;
    }

    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'ios') {
      const messaging = this.getMessaging();

      if (!messaging) {
        console.warn('Firebase Messaging is unavailable on iOS for this build');
        return false;
      }

      const authStatus = await messaging().requestPermission();
      const isAuthorized =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!isAuthorized) {
        console.warn('Firebase messaging permission not granted on iOS');
        return false;
      }

      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    return true;
  }

  async syncApnsTokenForFirebase() {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      const messaging = this.getMessaging();
      if (!messaging) {
        return null;
      }

      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      const apnsToken = devicePushToken?.data;

      if (this.isLikelyApnsToken(apnsToken)) {
        await messaging().setAPNSToken(apnsToken, __DEV__ ? 'sandbox' : 'prod');
        console.info('✅ APNs token synced to Firebase Messaging');
        return apnsToken;
      }
    } catch (error) {
      console.warn('⚠️ Failed to sync APNs token for Firebase:', error?.message);
    }

    return null;
  }

  async waitForApnsToken() {
    if (Platform.OS !== 'ios') {
      return null;
    }

    const maxAttempts = 8;
    const delayMs = 1200;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const messaging = this.getMessaging();
        if (!messaging) {
          return null;
        }

        const firebaseApnsToken = await messaging().getAPNSToken();
        if (this.isLikelyApnsToken(firebaseApnsToken)) {
          console.info('✅ APNs token available from Firebase Messaging');
          return firebaseApnsToken;
        }
      } catch (error) {
        console.warn('⚠️ Failed to read APNs token from Firebase:', error?.message);
      }

      const syncedApnsToken = await this.syncApnsTokenForFirebase();
      if (this.isLikelyApnsToken(syncedApnsToken)) {
        return syncedApnsToken;
      }

      if (attempt < maxAttempts - 1) {
        console.info(`⏳ Waiting for APNs token... (${attempt + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.warn('⚠️ APNs token was not available after waiting for iOS remote registration');
    return null;
  }

  async fetchFirebaseToken(options = {}) {
    const { forceRefresh = false } = options;

    if (Platform.OS !== 'ios') {
      return await this.fetchNativeDeviceToken();
    }

    if (!this.isMessagingSupported()) {
      console.warn('Firebase Messaging is unavailable; skipping FCM token fetch');
      return null;
    }

    const isReady = await this.ensureMessagingReady();

    if (!isReady) {
      return null;
    }

    if (Platform.OS === 'ios') {
      const apnsToken = await this.waitForApnsToken();

      if (!this.isLikelyApnsToken(apnsToken)) {
        console.warn('⚠️ Skipping Firebase token fetch because APNs token is not ready yet');
        return null;
      }
    }

    const maxAttempts = Platform.OS === 'ios' ? 5 : 3;
    const delayMs = Platform.OS === 'ios' ? 1500 : 1000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.info(
          `📱 ${Platform.OS.toUpperCase()} - Attempt ${attempt + 1}/${maxAttempts} to get Firebase messaging token...`
        );

        const messaging = this.getMessaging();
        if (!messaging) {
          return null;
        }

        if (forceRefresh && attempt === 0 && Platform.OS !== 'ios') {
          try {
            await messaging().deleteToken();
          } catch (error) {
            console.warn('⚠️ Failed to clear previous Firebase token:', error?.message);
          }
        }

        const token = await messaging().getToken();

        if (this.isValidServerPushToken(token)) {
          console.info(`✅ ${Platform.OS.toUpperCase()} Firebase registration token obtained`, {
            tokenLength: token.length,
            tokenPreview: `${token.substring(0, 30)}...`,
          });
          return token;
        }

        console.warn(`⚠️ ${Platform.OS.toUpperCase()} returned a non-FCM token, retrying...`, {
          tokenPreview: token ? `${token.substring(0, 30)}...` : 'null',
        });
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          console.error(`❌ Failed to get ${Platform.OS} Firebase registration token:`, error?.message);
        } else {
          console.warn(`⚠️ Firebase token attempt ${attempt + 1} failed, retrying... (${error?.message})`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));

      if (Platform.OS === 'ios') {
        await this.syncApnsTokenForFirebase();
      }
    }

    return null;
  }

  async fetchNativeDeviceToken() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('⚠️ Notification permissions not granted');
          return null;
        }
      }

      let token = null;
      const maxAttempts = 2;

      for (let attempt = 0; attempt < maxAttempts && !token; attempt++) {
        try {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();

          if (devicePushToken?.data) {
            token = devicePushToken.data;
            console.info('✅ ANDROID Firebase Token obtained:', {
              tokenType: 'FCM',
              tokenLength: token.length,
              tokenPreview: `${token.substring(0, 30)}...`,
            });
            return token;
          }
        } catch (error) {
          if (attempt === maxAttempts - 1) {
            console.error('❌ Failed to get Android Firebase token:', error.message);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          }
        }
      }

      return token;
    } catch (error) {
      console.error('❌ Error getting Android device token:', error.message);
      return null;
    }
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
   * For Android: Uses Firebase Cloud Messaging (FCM) token
   * For iOS: Uses Apple Push Notification service (APNs) token from Firebase
   * @returns {Promise<string|null>} FCM/APNs token or null if registration fails
   */
  async registerForPushNotifications() {
    if (this.registrationPromise) {
      return this.registrationPromise;
    }

    this.registrationPromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        console.warn('Push notifications are not supported on web');
        return null;
      }

      if (Platform.OS === 'ios' && !this.isMessagingSupported()) {
        console.warn('Skipping Firebase registration because Messaging is unavailable in this build');
        await this.configureAndroidChannels();
        return null;
      }

      const token = await this.fetchFirebaseToken({ forceRefresh: Platform.OS === 'android' });
      const source = 'firebase_messaging';

      if (!token) {
        console.error(`❌ Could not obtain ${Platform.OS} Firebase registration token. Ensure:
          - Firebase Messaging is configured in the native app
          - GoogleService-Info.plist is in project (iOS)
          - google-services.json is in app folder (Android)
          - Device has internet connection
          - Notification permissions are granted
          - iOS physical device has APNs capability and a valid push provisioning profile`);
      }

      this.fcmToken = token;
      
      // Store token locally
      if (this.fcmToken) {
        await AsyncStorage.setItem('fcm_token', this.fcmToken);
        await AsyncStorage.setItem('fcm_token_source', source);
        console.info(`✅ ${Platform.OS.toUpperCase()} Firebase token registered:`, { 
          source, 
          platform: Platform.OS,
          tokenType: 'FCM',
          tokenLength: this.fcmToken.length,
          tokenPreview: `${this.fcmToken.substring(0, 30)}...`
        });
      } else {
        await AsyncStorage.removeItem('fcm_token');
        await AsyncStorage.setItem('fcm_token_source', 'none');
      }

      // Configure notification channels for Android
      await this.configureAndroidChannels();

      return this.fcmToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    } finally {
      this.registrationPromise = null;
    }
    })();

    return this.registrationPromise;
  }

  /**
   * Get FCM token (always get fresh token)
   * @returns {Promise<string|null>} FCM token
   */
  async getFCMToken() {
    return await this.fetchFirebaseToken();
  }

  /**
   * @deprecated DO NOT USE - Expo tokens don't work with Firebase
   * 
   * This method is kept for reference only. Expo Push Tokens are NOT compatible
   * with Firebase Cloud Messaging or Apple Push Notification service.
   * 
   * Instead, use getDeviceToken() which returns Firebase tokens.
   * 
   * Why Expo tokens don't work:
   * - Expo tokens only work with Expo Push Service
   * - Firebase doesn't accept Expo tokens
   * - Your backend uses Firebase for sending notifications
   * - iOS and Android require Firebase tokens through APNs/FCM
   * 
   * @returns {Promise<string|null>} Expo Push Token (DON'T USE)
   */
  async getExpoPushToken() {
    console.warn('⚠️ getExpoPushToken() is deprecated. Use getDeviceToken() instead. Expo tokens do NOT work with Firebase.');
    try {
      const projectId =
        Constants.easConfig?.projectId ||
        Constants.expoConfig?.extra?.eas?.projectId ||
        null;
      const expoTokenData = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      if (expoTokenData?.data) {
        return expoTokenData.data;
      }
    } catch (_e) {}
    return null;
  }

  /**
   * Get the server push token.
   * Returns the Firebase registration token expected by the backend.
   * @returns {Promise<string|null>} Firebase registration token
   */
  async getDeviceToken() {
    return await this.getFCMToken();
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

  getMessageContent(remoteMessage = {}) {
    const notification = remoteMessage.notification || {};
    const data = remoteMessage.data || {};

    return {
      title: notification.title || data.title || data.subject || 'PhpBell For Business',
      body: notification.body || data.body || data.message || data.alert || 'You have a new notification.',
      data,
    };
  }

  /**
   * Setup notification listeners
   * @param {Function} onNotificationReceived - Callback when notification is received (app in foreground)
   * @param {Function} onNotificationTapped - Callback when notification is tapped
   */
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    if (this.notificationListener || this.responseListener) {
      console.info('ℹ️ Notification listeners already active');
      return;
    }
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

    // Listener for push token changes
    if (Platform.OS === 'ios') {
      const messaging = this.getMessaging();
      if (!messaging) {
        console.warn('Skipping iOS Firebase listeners because Messaging is unavailable in this build');
        return;
      }

      this.tokenListener = messaging().onTokenRefresh(async (newToken) => {
        console.info('🔄 Firebase token changed:', {
          tokenLength: newToken?.length,
          tokenPreview: newToken ? `${newToken.substring(0, 30)}...` : 'null',
        });

        if (this.isValidServerPushToken(newToken) && newToken !== this.fcmToken) {
          this.fcmToken = newToken;
          await AsyncStorage.setItem('fcm_token', newToken);
          await AsyncStorage.setItem('fcm_token_source', 'firebase_refresh');

          console.info('✅ FCM token updated and stored:', {
            tokenLength: newToken.length,
            tokenPreview: `${newToken.substring(0, 30)}...`,
          });
        }
      });

      this.messageListener = messaging().onMessage(async (remoteMessage) => {
        console.info('📩 Firebase message received on iOS:', remoteMessage);

        const { title, body, data } = this.getMessageContent(remoteMessage);

        // Surface data-only or suppressed foreground pushes as a local notification.
        await this.showLocalNotification({ title, body, data });

        if (onNotificationReceived) {
          onNotificationReceived({
            request: {
              content: {
                title,
                body,
                data,
              },
            },
          });
        }
      });

      this.openedAppListener = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.info('👆 Firebase notification opened app on iOS:', remoteMessage);

        if (onNotificationTapped) {
          onNotificationTapped({
            notification: {
              request: {
                content: this.getMessageContent(remoteMessage),
              },
            },
          });
        }
      });

      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (!remoteMessage || !onNotificationTapped) {
            return;
          }

          console.info('🚀 App opened from quit state by Firebase notification on iOS:', remoteMessage);

          onNotificationTapped({
            notification: {
              request: {
                content: this.getMessageContent(remoteMessage),
              },
            },
          });
        })
        .catch((error) => {
          console.warn('⚠️ Failed to get initial Firebase notification:', error?.message);
        });
    } else {
      // Android: listen for token refreshes
      this.tokenListener = Notifications.addPushTokenListener(async (tokenData) => {
        console.info('🔄 Push token changed:', tokenData);
        const newToken = tokenData?.data;

        if (newToken && newToken !== this.fcmToken) {
          this.fcmToken = newToken;
          await AsyncStorage.setItem('fcm_token', newToken);
          await AsyncStorage.setItem('fcm_token_source', 'refreshed');

          console.info('✅ FCM token updated and stored:', {
            tokenLength: newToken.length,
            tokenPreview: `${newToken.substring(0, 30)}...`,
          });
        }
      });

      // Android: handle foreground messages via Firebase Messaging
      const messaging = this.getMessaging();
      if (messaging) {
        this.messageListener = messaging().onMessage(async (remoteMessage) => {
          console.info('📩 Firebase message received on Android (foreground):', remoteMessage);

          const { title, body, data } = this.getMessageContent(remoteMessage);

          await this.showLocalNotification({ title, body, data });

          if (onNotificationReceived) {
            onNotificationReceived({
              request: {
                content: { title, body, data },
              },
            });
          }
        });
      }
    }

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
    if (this.tokenListener) {
      try {
        if (typeof this.tokenListener === 'function') {
          this.tokenListener();
        } else if (typeof this.tokenListener.remove === 'function') {
          this.tokenListener.remove();
        } else if (
          typeof Notifications.removeNotificationSubscription === 'function'
        ) {
          Notifications.removeNotificationSubscription(this.tokenListener);
        }
      } catch (e) {
        console.warn('Failed to remove token listener:', e);
      }
      this.tokenListener = null;
    }
    if (this.messageListener) {
      try {
        this.messageListener();
      } catch (e) {
        console.warn('Failed to remove Firebase message listener:', e);
      }
      this.messageListener = null;
    }
    if (this.openedAppListener) {
      try {
        this.openedAppListener();
      } catch (e) {
        console.warn('Failed to remove Firebase opened-app listener:', e);
      }
      this.openedAppListener = null;
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

  /**
   * Ensure device token is properly registered
   * This method forcefully re-registers the device token
   * @returns {Promise<string|null>} Fresh FCM/APNs token
   */
  async ensureDeviceTokenRegistered() {
    try {
      console.info('🔔 Ensuring device token is registered...');
      
      // Clear cached token to force fresh registration
      const oldToken = this.fcmToken;
      this.fcmToken = null;
      
      // Get fresh token
      const token = await this.registerForPushNotifications();
      
      if (token && token !== oldToken) {
        console.info('✅ Device token refreshed:', token);
        return token;
      } else if (token) {
        console.info('ℹ️ Device token unchanged:', token);
        return token;
      } else {
        console.warn('⚠️ Failed to ensure device token registration');
        return null;
      }
    } catch (error) {
      console.error('❌ Error ensuring device token registration:', error.message);
      return null;
    }
  }

  /**
   * Get token metadata for server registration
   * @returns {Promise<Object>} Token metadata
   */
  async getTokenMetadata() {
    const token = await this.getFCMToken();
    const tokenType = 'fcm';
    const appIdentifier = this.getAppIdentifier();
    
    return {
      push_token: token,
      push_token_type: tokenType,
      platform: Platform.OS,
      app_identifier: appIdentifier,
    };
  }
}

// Export singleton instance
export default new FCMService();
