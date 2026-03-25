# iOS FCM Token Fix - Summary

## Problem
FCM tokens were not being properly sent to the server on iOS devices. Android was working fine.

## Root Causes
1. iOS requires APNs (Apple Push Notification service) certificate setup
2. iOS push token retrieval needs proper permission handling
3. No mechanism to manually update token on server after login
4. Missing `useNextNotificationsApi` configuration for iOS

## Solution Implemented

### Code Changes

#### 1. **Enhanced fcmService.js**
- ✅ Improved `getDeviceToken()` with platform-specific iOS handling
  - Added 500ms delay for iOS to ensure permissions are fully registered
  - Better logging with token preview and platform info
  
- ✅ Added `ensureDeviceTokenRegistered()` method
  - Allows forcing token re-registration on demand
  - Useful if token becomes stale
  
- ✅ Added `getTokenMetadata()` method
  - Returns complete token info: token, type, platform, app identifier
  - Ready for server registration

#### 2. **Enhanced auth.js**
- ✅ Added `updateDeviceToken()` API function
  - Updates token on server for already-logged-in users
  - Can be called anytime without breaking auth flow
  
- ✅ Enhanced `verifyOTP()` with detailed iOS logging
  - Logs platform, token type, token preview
  - Warns if no token available on iOS
  
- ✅ Enhanced `login()` with detailed iOS logging
  - Same improvements as verifyOTP

#### 3. **Enhanced useFCMNotifications.js**
- ✅ Added `ensureDeviceTokenSynced()` hook
  - Can be called after login to ensure token is on server
  - Exported from hook for component use

#### 4. **Updated app.json iOS Config**
- ✅ Added `"useNextNotificationsApi": true`
  - Enables modern push notification API for iOS
  - Ensures compatibility with latest Expo notifications

#### 5. **API Index**
- ✅ Exported `updateDeviceToken` function
  - Available for use in components when needed

### Documentation Created

1. **iOS_PUSH_NOTIFICATIONS_SETUP.md**
   - Complete guide for APNs certificate setup
   - Firebase configuration steps
   - Troubleshooting guide
   - Server requirements
   - Reference materials

2. **iOS_FCM_TOKEN_IMPLEMENTATION.md**
   - Implementation details of all changes
   - Debugging checklist with expected logs
   - Manual testing code samples
   - Expected token formats
   - Common issues and solutions
   - Backend integration requirements

## How It Works Now

### On App Launch (iOS)
1. App requests notification permissions
2. `useFCMNotifications` hook initializes
3. `fcmService.registerForPushNotifications()` called
4. APNs token obtained via `getDevicePushTokenAsync()`
5. Token stored locally in AsyncStorage
6. Console logs show: `✅ Push token registered: { source: 'apns', token: ... }`

### During Login/OTP Verification
1. `getDeviceToken()` retrieves the APNs token
2. Token set as `fcm_token` in request payload
3. `push_token_type` set to `'apns'` for iOS (vs `'fcm'` for Android)
4. Enhanced logs show platform, token type, token preview
5. Server receives token and stores with user account
6. Console logs show: `✅ IOS Push Token successfully sent to server`

### If Token Needs Manual Update
```javascript
// In any component with access to API functions
import { updateDeviceToken } from '../lib/api';

// Manually sync token with server (non-critical)
await updateDeviceToken();

// Or force re-register token first
import fcmService from '../lib/notifications/fcmService';
const newToken = await fcmService.ensureDeviceTokenRegistered();
```

## Verification Steps

### ✅ To Verify Implementation is Working

**In Console Logs, you should see:**

1. **On App Launch:**
   ```
   ✅ Push token registered: { source: 'device', token: '...' }
   📲 IOS Push Token obtained: [valid token]
   ✅ Notification listeners registered
   ```

2. **During Login/OTP:**
   ```
   📱 OTP Verification Request Details: {
     platform: 'ios',
     tokenType: 'apns',
     hasToken: true,
     tokenPreview: '[first 30 chars]...',
     appIdentifier: 'com.shashankgupta01.phpbellforbusiness'
   }
   ✅ IOS Push Token successfully sent to server {
     tokenType: 'apns',
     platform: 'ios'
   }
   ```

3. **Network Request (check DevTools):**
   - Endpoint: `/verify-otp` or `/login`
   - Body includes: `fcm_token`, `push_token_type: 'apns'`

4. **Server Logs:**
   - Endpoint receives `fcm_token` parameter
   - Token is stored with user in database
   - Token type is `'apns'`

## If Still Not Working on iOS

### Checklist:
- [ ] APNs certificate uploaded to Firebase console
- [ ] GoogleService-Info.plist in project root
- [ ] `useNextNotificationsApi: true` in app.json
- [ ] Push Notifications capability added in Xcode
- [ ] Background Modes → Remote notifications enabled
- [ ] Notification permissions granted by user
- [ ] Using physical iOS device (not simulator ideally)
- [ ] Backend API accepts and stores `fcm_token` parameter

### Quick Debug:
```bash
# Rebuild iOS with clean prebuild
expo prebuild --clean --platform ios
```

## Backend Requirements

Your server API must:

1. **Accept token in `/verify-otp` and `/login` endpoints**
2. **Store with user:** `user.push_token` and `user.push_token_type`
3. **For iOS:** Use Firebase Admin SDK which auto-routes to APNs
4. **New endpoint:** `/update-device-token` for manual token updates

## Android Status
✅ **No changes needed** - Android FCM is already working correctly and continues to work as before.

## Next Actions

1. **Test on physical iOS device** with notifications enabled
2. **Verify token appears in server logs** as `apns` type
3. **Test sending notification** from Firebase console
4. **Check that notification is received** on device
5. **If issues persist**, refer to `iOS_FCM_TOKEN_IMPLEMENTATION.md` for detailed debugging

## Files Modified
- `/lib/notifications/fcmService.js` - Enhanced token management
- `/lib/api/auth.js` - Added updateDeviceToken, improved logging
- `/hooks/useFCMNotifications.js` - Added ensureDeviceTokenSynced
- `/lib/api/index.js` - Exported updateDeviceToken
- `/app.json` - Added useNextNotificationsApi for iOS

## Files Created
- `iOS_PUSH_NOTIFICATIONS_SETUP.md` - Complete APNs setup guide
- `iOS_FCM_TOKEN_IMPLEMENTATION.md` - Implementation details and debugging

## Summary
iOS FCM token registration is now properly implemented with:
- ✅ Enhanced APNs token retrieval with platform-specific handling
- ✅ Better error logging for iOS-specific issues
- ✅ Manual token update capability
- ✅ Complete documentation for setup and troubleshooting
- ✅ Server integration examples
- ✅ Debugging checklist with expected outputs
