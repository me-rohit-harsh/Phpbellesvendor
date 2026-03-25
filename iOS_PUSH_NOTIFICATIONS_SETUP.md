# iOS Push Notifications Setup Guide

This guide outlines the complete setup required for iOS push notifications (APNs) to work correctly with Firebase Cloud Messaging.

## Overview

- **Android**: Uses Firebase Cloud Messaging (FCM) - works automatically once google-services.json is set up
- **iOS**: Uses Apple Push Notification service (APNs) - requires additional setup with Apple Developer Account and Firebase

## iOS Setup Steps

### 1. Create APNs Certificate in Apple Developer Account

1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click the **+** button to create a new key
4. Select **Apple Push Notifications service (APNs)**
5. Click **Continue** and then **Register**
6. Download the `.p8` file (keep this safe!)
7. Note your **Team ID** and **Key ID** from the certificate details

### 2. Upload APNs Certificate to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Cloud Messaging** tab
4. Scroll to **APNs certificates**
5. Click **Upload Certificate**
6. Upload the `.p8` file you downloaded
7. Enter:
   - **Key ID**: From step 1.7
   - **Team ID**: From step 1.7
8. Check **Use this certificate for development** checkbox
9. Click **Upload**

### 3. Verify GoogleService-Info.plist

Ensure your `GoogleService-Info.plist` file is properly configured:

```xml
<key>BUNDLE_ID</key>
<string>com.shashankgupta01.phpbellforbusiness</string>
<key>GCM_SENDER_ID</key>
<string>YOUR_SENDER_ID</string>
```

The file should already be in your project root.

### 4. Enable Push Notifications in Xcode

After running `expo prebuild`:

1. Open `ios/PhpBellForBusiness.xcworkspace` in Xcode
2. Select the project → Select target "PhpBellForBusiness"
3. Go to **Signing & Capabilities**
4. Click **+ Capability**
5. Add **Push Notifications**
6. Ensure **Background Modes** has **Remote notifications** checked

### 5. App.json Configuration

The app.json has been configured with:

```json
"ios": {
  "useNextNotificationsApi": true,
  "googleServicesFile": "./GoogleService-Info.plist"
}
```

This enables the proper Expo notifications API for iOS.

## Testing APNs Token Registration on iOS

### During Development

1. App requests notification permissions
2. User grants permission
3. `fcmService.getDeviceToken()` retrieves APNs token
4. Token is sent to server during login/verification
5. Check logs for: `"📲 IOS Push Token obtained: ..."`

### Manual Testing

```javascript
// In browser console or test component
import fcmService from '../lib/notifications/fcmService';

// Get APNs token
const token = await fcmService.getDeviceToken();
console.log('APNs Token:', token);

// Get all token metadata
const metadata = await fcmService.getTokenMetadata();
console.log('Token Metadata:', metadata);
```

## Troubleshooting iOS Push Notifications

### Issue: APNs Token is null or undefined

**Causes:**
1. Push notification permission not granted
2. APNs certificate not uploaded to Firebase
3. GoogleService-Info.plist not properly configured
4. Device is not a physical device (simulator might not work correctly)

**Solutions:**
1. Verify the app explicitly requests notification permissions
2. Check Firebase Console → Cloud Messaging tab → APNs certificates
3. Verify GoogleService-Info.plist exists and is correct
4. Test on a physical iOS device

### Issue: Token not sent to server

**Causes:**
1. Network issue during login
2. API endpoint not accepting the token

**Solutions:**
1. Check network logs in browser DevTools
2. Verify API endpoint `/verify-otp`, `/login` accepts `fcm_token` parameter
3. Use `updateDeviceToken()` API to manually sync

### Issue: Notifications not received on iOS

**Causes:**
1. APNs certificate expired
2. Token not registered on server
3. Payload format incorrect
4. Notification permissions revoked

**Solutions:**
1. Refresh APNs certificate (renew if expired)
2. Check server logs to see if token is stored
3. Verify server payload format matches APNs requirements
4. User should re-grant notification permissions

## Code Changes for iOS Push Notifications

### 1. **fcmService.js**
- Enhanced `getDeviceToken()` with platform-specific handling
- Added `ensureDeviceTokenRegistered()` for forced re-registration
- Added `getTokenMetadata()` for complete token information

### 2. **auth.js**
- `updateDeviceToken()` API method to sync token with server
- Sends token during `verifyOTP()` and `login()`
- Logs detailed token information

### 3. **useFCMNotifications.js**
- `ensureDeviceTokenSynced()` hook to refresh token after login
- Proper error handling for token registration

### 4. **app.json**
- Added `useNextNotificationsApi: true` for iOS
- Enabled GoogleService-Info.plist integration

## Verification Checklist

- [ ] APNs certificate created in Apple Developer Account
- [ ] APNs certificate uploaded to Firebase console
- [ ] GoogleService-Info.plist in project root
- [ ] `useNextNotificationsApi: true` in app.json
- [ ] Push Notifications capability added in Xcode
- [ ] Background Modes → Remote notifications enabled
- [ ] App requests notification permissions on first launch
- [ ] Token appears in logs with format: `"📲 IOS Push Token obtained: ..."`
- [ ] Token is sent to server in login API call
- [ ] Server accepts and stores the `fcm_token` parameter with `push_token_type: 'apns'`

## Server-Side Requirements

Your backend API must handle:

1. **Accept token during authentication:**
   - `/verify-otp` endpoint receives `fcm_token` and `push_token_type`
   - `/login` endpoint receives `fcm_token` and `push_token_type`

2. **Store token per user:**
   - Associate FCM/APNs token with user ID
   - Handle token updates (device changed, token refreshed)
   - Support multiple tokens per user (multiple devices)

3. **Send notifications via FCM:**
   - Firebase Admin SDK automatically routes to APNs for iOS users
   - Ensure `fcm_token` field contains the correct token
   - Set `push_token_type` appropriately ('fcm' or 'apns')

## Useful Resources

- [Apple Push Notification service](https://developer.apple.com/notifications/)
- [Firebase APNs Setup](https://firebase.google.com/docs/cloud-messaging/ios/certs)
- [Expo Notifications](https://docs.expo.dev/guides/push-notifications/)
- [Firebase Admin SDK](https://firebase.google.com/docs/cloud-messaging/send-message)
