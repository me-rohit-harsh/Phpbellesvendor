# Firebase vs Expo Push Tokens - iOS Fix

## Problem
iOS was sending Expo Push Tokens (format: `ExponentPushToken[...]`) instead of Firebase APNs tokens.

The server and Firebase push notification service require:
- **Android**: Firebase Cloud Messaging (FCM) token format
- **iOS**: Firebase APNs token format

## What We Changed

### Removed Expo Token Fallback
**Before:** If Firebase token failed, app would fall back to Expo Push Token
```javascript
// OLD - WRONG
if (!token) {
  // Fall back to Expo token
  const expoToken = await Notifications.getExpoPushTokenAsync();
}
```

**After:** Only use Firebase tokens, NO fallback to Expo tokens
```javascript
// NEW - CORRECT
// For iOS: Only Firebase APNs tokens
// For Android: Only Firebase FCM tokens
// NO Expo tokens at any point
```

### Enhanced Firebase Token Retrieval

**iOS-specific improvements:**
- Added 1500ms initial delay for Firebase initialization
- Up to 5 retry attempts (vs 3 before)
- Checks if token is Expo format and retries if so
- Longer delays between retries (exponential backoff)
- Clear logging at each step

**Android improvements:**
- Streamlined logic
- 3 retry attempts with exponential backoff
- Clear validation of token format

### Detailed Logging

Now logs show:
```
📱 IOS - Attempt 1/5 to get device token...
✅ IOS: Successfully got Firebase APNs token
✅ IOS Firebase token registered: {
  source: 'device',
  platform: 'ios',
  tokenType: 'APNs',
  tokenLength: 152,
  tokenPreview: 'eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH...'
}
```

## Token Formats

### Firebase APNs Token (iOS) ✅
```
eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UHnPr1E5ABZzSlzn_p5S9g64kQwehHk6rz5kRseX-5Xtm9t2e939h1np6ji1t8DKClIQC_a6w7xOEMyHF1uqm3r-nG-roBpikUXvg0Wz1DlI
```
- Contains colon (`:`)
- Long alphanumeric string
- ~150-180 characters
- Firebase sends to APNs service

### Firebase FCM Token (Android) ✅
```
fVNxxxxxx:APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Similar format to iOS APNs
- Contains colon
- Firebase sends to Android devices

### Expo Push Token (OLD - NOT USED) ❌
```
ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]
```
- Starts with `ExponentPushToken`
- Only works with Expo Push Service
- NOT accepted by Firebase
- NOT accepted by your backend

## Why This Matters

### Why NOT Expo Tokens?
1. **Expo tokens only work with Expo Push Service** - not Firebase
2. **Your backend expects Firebase tokens**
3. **Firebase doesn't route Expo tokens to APNs**
4. **Notifications won't be delivered** with Expo tokens

### Why Firebase Tokens?
1. **Firebase automatically routes:**
   - Android FCM tokens → Firebase Cloud Messaging → Android devices
   - iOS APNs tokens → Apple Push Notification service → iOS devices
2. **Backend can send via Firebase Admin SDK**
3. **Tokens are recognized by your push notification service**
4. **Notifications will be delivered correctly**

## Implementation Details

### Code Changes

**fcmService.js:**
- `registerForPushNotifications()`: Enhanced with Firebase-only logic
- `getDeviceToken()`: No Expo token fallback, Firebase only
- Better retry logic and validation
- Platform-specific handling for iOS delays

**Features:**
- Detects and rejects Expo tokens on iOS
- Longer initialization delay for iOS
- Exponential backoff retries
- Clear error messages with solutions
- Caching of valid Firebase tokens

### Testing

Check logs during app startup:
```javascript
✅ IOS Firebase token registered: {
  tokenType: 'APNs',
  tokenPreview: 'eoHNlbcXSi...'
}
```

Not:
```javascript
⚠️ Got Expo token instead of Firebase APNs token
```

## Verification Steps

### 1. Check App Logs
```
✅ IOS Firebase token registered
  - Should show Firebase token format (with colon)
  - Should NOT show ExponentPushToken
```

### 2. Check Network Request
Browser DevTools → Network → Login/OTP request:
```json
{
  "fcm_token": "eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UHnPr1E...",
  "push_token_type": "apns",
  "app_identifier": "com.shashankgupta01.phpbellforbusiness"
}
```

NOT:
```json
{
  "fcm_token": "ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]",
  ...
}
```

### 3. Check Server Logs
Backend should receive:
- `fcm_token`: Firebase APNs token format (has colon)
- `push_token_type`: `'apns'` for iOS
- Token should work when you send notifications via Firebase

## Troubleshooting

### Issue: Still Seeing ExponentPushToken
**Cause:** FCM token retrieval failing, old cache being used

**Solution:**
1. Clear app cache: Settings → App → PhpBell → Storage → Clear Cache
2. Or delete: `AsyncStorage.removeItem('fcm_token')`
3. Ensure APNs certificate is in Firebase
4. Check GoogleService-Info.plist exists
5. Rebuild: `expo prebuild --clean --platform ios`

### Issue: Token is null/undefined
**Cause:** Firebase not initialized or permissions denied

**Solution:**
1. Verify notification permissions granted
2. Check APNs certificate in Firebase console
3. Verify GoogleService-Info.plist in project
4. Test on real iOS device (simulator may have issues)
5. Check network connectivity

### Issue: Tokens still not received on server
**Cause:** Network issue or API not accepting parameter

**Solution:**
1. Check network request in DevTools
2. Verify API endpoint accepts `fcm_token` parameter
3. Ensure backend stores token with user
4. Check if token format is correct (should have colon)

## What to Tell Your Backend Team

"We now send **Firebase tokens only** for both Android and iOS:
- **Android**: Firebase Cloud Messaging (FCM) format token
- **iOS**: Firebase APNs token format (both routed through Firebase)
- **Never**: Expo Push Service tokens

The token format contains a colon and looks like: `prefix:APA91bFe5O9UHnPr1E5ABZz...`

We no longer support Expo tokens - only Firebase tokens that work with your Firebase backend."

## Related Files Modified
- `/lib/notifications/fcmService.js` - Firebase-only token logic
- All iOS token handling updated

## Related Files (Already Set Up)
- `/app.json` - Has `useNextNotificationsApi: true`
- `/GoogleService-Info.plist` - iOS Firebase config
- `iOS_PUSH_NOTIFICATIONS_SETUP.md` - APNs setup guide
