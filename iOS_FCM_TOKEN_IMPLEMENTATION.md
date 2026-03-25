# iOS FCM Token Implementation - Complete Guide

## Changes Made

### 1. **Enhanced fcmService.js**

#### Added Methods:
- **`ensureDeviceTokenRegistered()`**: Forces re-registration of device token
- **`getTokenMetadata()`**: Returns complete token information for server registration
- **Improved `getDeviceToken()`**: Better logging and platform-specific handling for iOS

#### Improvements:
- Added 500ms delay for iOS to ensure notification permissions are fully registered
- Better error messages with platform-specific debugging
- Token source tracking for both FCM and APNs

### 2. **Enhanced auth.js**

#### New Function:
- **`updateDeviceToken(options)`**: Updates device token on server for already-logged-in users
  - Can be called anytime to resync token with server
  - Non-critical - won't fail the login process if it fails

#### Improvements:
- Added detailed logging in `verifyOTP()` for iOS token transmission
- Added detailed logging in `login()` for iOS token transmission
- Logs include: platform, token type, token preview, app identifier

### 3. **Enhanced useFCMNotifications.js**

#### New Function:
- **`ensureDeviceTokenSynced()`**: Re-registers and syncs device token with server
  - Can be called after successful login
  - Useful for ensuring token is updated on server

#### Export Changes:
- Added `ensureDeviceTokenSynced` to hook return value

### 4. **Updated app.json**

#### iOS Configuration:
- Added `"useNextNotificationsApi": true` - enables modern notification API for iOS
- Already has `"googleServicesFile": "./GoogleService-Info.plist"` configured

### 5. **Updated API Index**

- Exported new `updateDeviceToken()` function for use in components

## Debugging Checklist for iOS FCM Token

### Step 1: Verify App Startup
When app launches, check logs for:
```
✅ Push token registered: { source: 'device', token: ...
📲 IOS Push Token obtained: [token starts with 'ExponentPushToken' or APNs format]
```

### Step 2: Verify Login/OTP
During OTP verification or login, check logs for:
```
📱 OTP Verification Request Details: {
  platform: 'ios',
  tokenType: 'apns',
  hasToken: true,
  tokenPreview: '[first 30 chars of token]...',
  appIdentifier: 'com.shashankgupta01.phpbellforbusiness'
}

✅ IOS Push Token successfully sent to server {
  tokenType: 'apns',
  platform: 'ios'
}
```

### Step 3: Verify Server Reception
Check your backend logs to confirm:
- Endpoint `/verify-otp` or `/login` received the request
- `fcm_token` parameter contains a valid token
- `push_token_type` is set to `'apns'` for iOS
- Token is stored in database associated with user

### Step 4: Network Verification
In browser DevTools → Network tab, check the login/verify-otp request:
- Headers include proper Authorization if already logged in
- Request body contains:
  ```json
  {
    "fcm_token": "[valid token]",
    "push_token_type": "apns",
    "platform": "ios",
    "app_identifier": "com.shashankgupta01.phpbellforbusiness"
  }
  ```

## Manual Testing in Code

Add this to a test component or use React DevTools:

```javascript
import { updateDeviceToken } from '../lib/api/auth';
import fcmService from '../lib/notifications/fcmService';

// Test 1: Get current token
async function testGetToken() {
  const token = await fcmService.getDeviceToken();
  console.log('Current APNs Token:', token);
}

// Test 2: Get token metadata
async function testGetMetadata() {
  const metadata = await fcmService.getTokenMetadata();
  console.log('Token Metadata:', metadata);
}

// Test 3: Ensure token is registered
async function testEnsureToken() {
  const token = await fcmService.ensureDeviceTokenRegistered();
  console.log('Ensured Token:', token);
}

// Test 4: Update token on server
async function testUpdateTokenOnServer() {
  const result = await updateDeviceToken();
  console.log('Server Update Result:', result);
}

// Run all tests
async function runAllTests() {
  await testGetToken();
  await testGetMetadata();
  await testEnsureToken();
  await testUpdateTokenOnServer();
}
```

## Expected Token Format

### Android (FCM)
- Format: `d3h...` (long alphanumeric string from Firebase)
- Type: `'fcm'`
- Example: `d3h8f2k0p9l2m5n8q1r4s7t...`

### iOS (APNs)
- Format: Either `ExponentPushToken[...]` or APNs device token
- Type: `'apns'`
- Example: `ExponentPushToken[1a2b3c4d5e6f7g8h9i0j...]`

## If iOS Token is NOT Being Sent

### Common Issues & Solutions:

**Issue 1: Token is null in logs**
```
⚠️ No IOS push token available during login
```
**Solution:**
1. Ensure physical iOS device (simulators may have issues)
2. Verify notification permissions granted
3. Check APNs certificate is uploaded to Firebase
4. Rebuild: `expo prebuild --clean --platform ios`

**Issue 2: Token is old/stale**
```
ℹ️ Device token unchanged
```
**Solution:**
1. Call `fcmService.ensureDeviceTokenRegistered()` to force refresh
2. Or call `updateDeviceToken()` API manually
3. Check if Apple has issued new APNs token

**Issue 3: Permission not granted**
```
⚠️ Notification permissions not granted
⚠️ Failed to get native device push token for ios
```
**Solution:**
1. User needs to grant notification permission
2. Test in app with permission request
3. Check Settings → Notifications → App is enabled

## Required Backend Changes

Your server must:

1. **Accept token in login/verify endpoints:**
   ```javascript
   const { fcm_token, push_token_type, app_identifier } = req.body;
   ```

2. **Store token with user:**
   ```javascript
   // Associate token with user ID
   user.push_token = fcm_token;
   user.push_token_type = push_token_type; // 'fcm' or 'apns'
   user.last_token_update = new Date();
   ```

3. **Use Firebase Admin SDK to send:**
   ```javascript
   // Firebase automatically routes to APNs for 'apns' tokens
   admin.messaging().send({
     token: user.push_token,
     notification: { title: '...', body: '...' },
     webpush: { ... } // ignored for APNs
   });
   ```

## Verification Commands

### Check logs in Xcode Console (if building with EAS):
```bash
# Filter for FCM/push related logs
grep -i "push\|token\|notification" ~/Library/Logs/EAS/build.log
```

### Check app logs in real-time:
```bash
# If using expo dev client
expo start --dev-client

# Or via Android logcat for reference
adb logcat | grep -i "fcm\|token"
```

## iOS APNs Complete Setup (if not done)

See `iOS_PUSH_NOTIFICATIONS_SETUP.md` for complete APNs certificate creation and Firebase configuration.

## Next Steps

1. **Ensure APNs certificate is uploaded** to Firebase (required for iOS)
2. **Rebuild iOS app** with `expo prebuild --clean --platform ios`
3. **Test on real iOS device** with proper notification permissions
4. **Check backend logs** to verify token is received and stored
5. **Send test notification** via Firebase Console to verify delivery
6. **Monitor logs** for any errors using console.info statements added

## Support Resources

- [iOS FCM Setup Guide](./iOS_PUSH_NOTIFICATIONS_SETUP.md)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications](https://docs.expo.dev/guides/push-notifications/)
- [Apple Push Notification Service](https://developer.apple.com/notifications/)
