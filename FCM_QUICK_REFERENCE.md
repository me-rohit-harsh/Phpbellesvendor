# 🚀 FCM Quick Reference

## Import & Use

### Get FCM Token
```javascript
import fcmService from '../lib/notifications/fcmService';

const token = await fcmService.getFCMToken();
console.log('Token:', token);
```

### Use in Component
```javascript
import useFCMNotifications from '../hooks/useFCMNotifications';

export default function MyScreen() {
  const { showLocalNotification } = useFCMNotifications();

  const testNotif = async () => {
    await showLocalNotification(
      'Title',
      'Body text',
      { type: 'alert', data: 'any' }
    );
  };

  return <Button onPress={testNotif} title="Test" />;
}
```

### Show Toast Notification
```javascript
import { ToastManager } from '../app/components/NotificationToast';

ToastManager.success('Success message!');
ToastManager.error('Error message!');
ToastManager.warning('Warning message!');
ToastManager.info('Info message!');
```

## Backend Integration

### Request Payload (Auto-included)
```javascript
// When calling requestOTP()
{
  phone: "+1234567890",
  email: "vendor@example.com",
  fcm_token: "ExponentPushToken[xxx]",
  app_identifier: "com.shashankgupta01.phpbellforbusiness"
}
```

### Send Notification from Backend
```javascript
POST https://exp.host/--/api/v2/push/send
Content-Type: application/json

{
  "to": "ExponentPushToken[xxx]",
  "title": "New Order",
  "body": "Order #1234 received",
  "sound": "default",
  "priority": "high",
  "channelId": "orders",
  "data": {
    "type": "new_order",
    "orderId": "1234"
  }
}
```

## Notification Types

| Type | Navigate To | Toast Type |
|------|-------------|------------|
| `new_order` | `/business/analytics` | Info |
| `order_update` | `/business/analytics` | Info |
| `verification_complete` | `/business/profile` | Success |
| `menu_approved` | `/business/menu` | Success |
| `alert` | `/home` | Warning |

## Testing

### Test Screen
Navigate to: `/business/fcm-test`

### Manual Test
```javascript
import fcmService from '../lib/notifications/fcmService';

await fcmService.showLocalNotification({
  title: 'Test',
  body: 'Testing notification',
  data: { type: 'alert' }
});
```

### Check Token
```javascript
const token = await fcmService.getFCMToken();
const appId = fcmService.getAppIdentifier();
console.log({ token, appId });
```

## Files Structure

```
lib/
  notifications/
    fcmService.js         → Core FCM service
hooks/
  useFCMNotifications.js  → React hook
app/
  _layout.jsx             → Global FCM init
  business/
    fcm-test.jsx          → Test screen
lib/api/
  auth.js                 → requestOTP updated
```

## Key Functions

### fcmService
```javascript
fcmService.registerForPushNotifications()
fcmService.getFCMToken()
fcmService.getAppIdentifier()
fcmService.showLocalNotification(options)
fcmService.clearAllNotifications()
fcmService.clearFCMToken()
```

### useFCMNotifications Hook
```javascript
const {
  registerForNotifications,
  getFCMToken,
  showLocalNotification,
  clearAllNotifications
} = useFCMNotifications({ autoRegister: true });
```

## Remember

✅ Works only on **physical devices**
✅ Requires notification permissions
✅ Token auto-sent with `requestOTP()`
✅ Three channels: default, orders, alerts
✅ Auto-navigation based on notification type

## Common Issues

**No token?**
- Check device permissions
- Ensure physical device
- Check console logs

**Notifications not showing?**
- Verify permissions granted
- Check notification settings
- Use correct channelId

**Can't test?**
- Use `/business/fcm-test` screen
- Check console logs
- Use local notifications

---
📖 Full docs: `FCM_INTEGRATION_GUIDE.md`
✅ Setup status: `FCM_SETUP_COMPLETE.md`
