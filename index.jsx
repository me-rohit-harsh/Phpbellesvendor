// Register FCM background message handler BEFORE expo-router entry.
// This must use require() (not import) so it runs before expo-router initializes.
// Required by @react-native-firebase/messaging to process FCM messages when
// the app is in background or killed state (especially on iOS).
const { Platform } = require('react-native');

if (Platform.OS === 'ios') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message received on iOS:', remoteMessage);
    });
  } catch (e) {
    console.warn('[FCM] Could not register iOS background handler:', e?.message);
  }
}

require('expo-router/entry');
