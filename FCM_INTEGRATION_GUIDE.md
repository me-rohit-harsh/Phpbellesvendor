# Firebase Cloud Messaging (FCM) Integration Guide

## Overview
This guide covers the complete Firebase Cloud Messaging (FCM) integration for the PhpBell Vendor app, enabling push notifications for orders, alerts, and important updates.

## Features Implemented

### 1. **FCM Service** (`lib/notifications/fcmService.js`)
- Token registration and management
- Notification permission handling
- Notification channels for Android
- Local notification display
- Token storage in AsyncStorage
- Badge count management (iOS)

### 2. **Custom Hook** (`hooks/useFCMNotifications.js`)
- React hook for easy FCM integration
- Auto-registration on app launch
- Notification received handler (foreground)
- Notification tapped handler (background/killed)
- Type-based notification routing
- In-app toast notifications

### 3. **API Integration** (`lib/api/auth.js`)
- FCM token automatically sent with `request-otp` API call
- App identifier included in all auth requests
- Format:
  ```javascript
  {
    phone: "+1234567890",
    email: "vendor@example.com",
    fcm_token: "ExponentPushToken[xxx]",
    app_identifier: "com.shashankgupta01.phpbellforbusiness"
  }
  ```

### 4. **Global Setup** (`app/_layout.jsx`)
- FCM initialized at app root level
- Notification listeners active throughout app lifecycle
- Toast notifications for all incoming notifications

## Usage

### Basic Setup (Already Done in `_layout.jsx`)

```javascript
import useFCMNotifications from '../hooks/useFCMNotifications';

export default function App() {
  // Auto-registers for notifications and sets up listeners
  useFCMNotifications({
    autoRegister: true,
    onNotificationReceived: (notification) => {
      console.log('Notification received:', notification);
    },
    onNotificationTapped: (response) => {
      console.log('Notification tapped:', response);
    }
  });

  return <YourApp />;
}
```

### Manual FCM Operations

```javascript
import fcmService from '../lib/notifications/fcmService';

// Get FCM token
const token = await fcmService.getFCMToken();

// Show local notification (testing)
await fcmService.showLocalNotification({
  title: 'Test Notification',
  body: 'This is a test',
  data: { type: 'test' }
});

// Clear all notifications
await fcmService.clearAllNotifications();

// Clear token on logout
await fcmService.clearFCMToken();
```

### Using the Hook in Components

```javascript
import useFCMNotifications from '../hooks/useFCMNotifications';

export default function MyComponent() {
  const { 
    getFCMToken, 
    showLocalNotification,
    clearAllNotifications 
  } = useFCMNotifications({ autoRegister: false });

  const testNotification = async () => {
    await showLocalNotification(
      'Order Received',
      'You have a new order #1234',
      { type: 'new_order', orderId: '1234' }
    );
  };

  return <Button onPress={testNotification} title="Test" />;
}
```

## Notification Types

The system handles different notification types with custom actions:

| Type | Description | Action |
|------|-------------|--------|
| `new_order` | New order received | Navigate to analytics |
| `order_update` | Order status changed | Navigate to analytics |
| `verification_complete` | Vendor verified | Navigate to profile + Success toast |
| `menu_approved` | Menu approved | Navigate to menu + Success toast |
| `alert` | Important alerts | Show warning toast |

### Backend Notification Payload Format

```json
{
  "to": "ExponentPushToken[xxx]",
  "sound": "default",
  "title": "New Order",
  "body": "You have a new order #1234",
  "data": {
    "type": "new_order",
    "orderId": "1234",
    "customData": "any additional data"
  },
  "priority": "high",
  "channelId": "orders"
}
```

## Android Notification Channels

Three notification channels are configured:

1. **Default Channel** - General notifications
2. **Orders Channel** (`orders`) - Order-related notifications (high priority)
3. **Alerts Channel** (`alerts`) - Critical alerts (max priority)

## Configuration Files Updated

### 1. `app.json`
- Added `expo-notifications` plugin configuration
- Added Android permissions: `POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`
- Added `googleServicesFile` reference for Android
- Added `NSUserNotificationsUsageDescription` for iOS

### 2. `package.json`
- `expo-notifications` already included (v0.32.12)
- `expo-constants` already included (v18.0.10)
- `expo-device` already included (v8.0.9)

## Testing

### Test Local Notifications

```javascript
import fcmService from '../lib/notifications/fcmService';

// Test notification
await fcmService.showLocalNotification({
  title: 'Test Notification',
  body: 'This is a test notification',
  data: { type: 'alert', message: 'Testing' }
});
```

### Test FCM Token Retrieval

```javascript
import fcmService from '../lib/notifications/fcmService';

const token = await fcmService.getFCMToken();
console.log('FCM Token:', token);
// Output: ExponentPushToken[xxxxxxxxxxxxxx]
```

### Test API Integration

When you call `requestOTP`, the FCM token is automatically included:

```javascript
import { requestOTP } from '../lib/api/auth';

await requestOTP({
  phone: '+1234567890',
  email: 'test@example.com'
});

// Request payload will include:
// {
//   phone: '+1234567890',
//   email: 'test@example.com',
//   fcm_token: 'ExponentPushToken[xxx]',
//   app_identifier: 'com.shashankgupta01.phpbellforbusiness'
// }
```

## Building with FCM

### Development Build

```bash
# Install dependencies
npm install

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Production Build (EAS)

```bash
# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

**Note**: Make sure `google-services.json` is in place at `android/app/google-services.json`

## Permissions

### Android (API 33+)
- `POST_NOTIFICATIONS` - Required for push notifications
- `VIBRATE` - For notification vibration
- `RECEIVE_BOOT_COMPLETED` - For notifications after device restart

### iOS
- `NSUserNotificationsUsageDescription` - Required for notification permission dialog

## Token Lifecycle

1. **Registration**: Token registered on app launch via `useFCMNotifications` hook
2. **Storage**: Token stored in AsyncStorage for offline access
3. **API Calls**: Token automatically included in `request-otp` and other auth calls
4. **Logout**: Token cleared from storage when user logs out

## Troubleshooting

### No notifications on Android emulator
- Push notifications require a **physical device**
- Emulators/simulators don't support FCM

### Token not generated
- Check device permissions
- Ensure `google-services.json` is present (Android)
- Check Expo project ID in `app.json`

### Notifications not showing in foreground
- Check `Notifications.setNotificationHandler` configuration
- Ensure `shouldShowAlert: true` is set

### Navigation not working on tap
- Verify routes exist in `app/` directory
- Check `router.push()` paths in `useFCMNotifications.js`

## Backend Integration

Your backend should:

1. **Store FCM tokens** from `request-otp` API call
2. **Send notifications** using Expo Push API:
   ```
   POST https://exp.host/--/api/v2/push/send
   ```
3. **Include notification data** with proper type and payload

Example backend notification:
```javascript
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: fcmToken,
    sound: 'default',
    title: 'New Order',
    body: 'Order #1234 received',
    data: { type: 'new_order', orderId: '1234' },
    channelId: 'orders'
  })
});
```

## Files Modified/Created

### Created:
- ✅ `lib/notifications/fcmService.js` - Core FCM service
- ✅ `hooks/useFCMNotifications.js` - React hook for FCM
- ✅ `FCM_INTEGRATION_GUIDE.md` - This documentation

### Modified:
- ✅ `lib/api/auth.js` - Added FCM token to `requestOTP`
- ✅ `app/_layout.jsx` - Global FCM initialization
- ✅ `app.json` - FCM configuration and permissions

## Next Steps

1. **Test on physical device** - Download dev build and test notifications
2. **Backend integration** - Ensure backend stores and uses FCM tokens
3. **Custom notification handlers** - Add more notification types as needed
4. **Analytics** - Track notification open rates and user engagement

## Support

For issues or questions:
- Check Expo Notifications docs: https://docs.expo.dev/push-notifications/overview/
- Review Firebase console for message delivery status
- Check device notification settings and permissions
