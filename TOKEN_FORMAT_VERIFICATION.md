# Token Format Verification Guide

## Quick Reference

### ✅ CORRECT Tokens (What You Should See)

**iOS - Firebase APNs Format:**
```
eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UHnPr1E5ABZzSlzn_p5S9g64kQwehHk6rz5kRseX-5Xtm9t2e939h1np6ji1t8DKClIQC_a6w7xOEMyHF1uqm3r-nG-roBpikUXvg0Wz1DlI
```
✓ Has a colon in the middle  
✓ Long alphanumeric string (150-180 chars)  
✓ Works with Firebase

**Android - Firebase FCM Format:**
```
fk5lAa:APCwXsZ3gF8UkxR2q_pN3nK9mL0oJ2H1W5T6Y7B8C9D
```
✓ Has a colon  
✓ Works with Firebase

### ❌ WRONG Tokens (What You Should NOT See)

**Expo Token Format (NOT WORKING WITH Firebase):**
```
ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]
```
✗ Starts with `ExponentPushToken`  
✗ Has square brackets  
✗ Does NOT work with Firebase  
✗ Will NOT deliver notifications

## Testing Checklist

### During App Startup

**Look for these logs:**

✅ CORRECT:
```
✅ IOS Firebase token registered: {
  source: 'device',
  platform: 'ios',
  tokenType: 'APNs',
  tokenLength: 152,
  tokenPreview: 'eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH...'
}
```

✅ ALSO CORRECT (if retrying):
```
📱 IOS - Attempt 2/5 to get device token...
⚠️ Attempt 1 failed, retrying... (error message)
✅ IOS: Successfully got Firebase APNs token
```

❌ WRONG:
```
⚠️ IOS: Got Expo token instead of Firebase APNs token. Retrying...
```
This means Firebase setup issue - check APNs certificate

❌ WRONG:
```
✅ Push token registered: {
  source: 'expo',
  token: 'ExponentPushToken[...'
}
```
This means fallback to Expo (should NOT happen anymore)

### During Login/OTP

**Check Network Request (DevTools):**

✅ CORRECT Request:
```json
POST /verify-otp
{
  "phone": "+911234567890",
  "otp": "123456",
  "fcm_token": "eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH...",
  "push_token_type": "apns",
  "app_identifier": "com.shashankgupta01.phpbellforbusiness"
}
```

❌ WRONG Request:
```json
{
  "fcm_token": "ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]",
  "push_token_type": "apns"
}
```

### Server Logs

✅ CORRECT - Backend receives:
```
Token: eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH...
Type: apns
Platform: ios
Status: Successfully stored with user
```

❌ WRONG - Backend might log:
```
Token: ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]
Status: Invalid Firebase token format
```

## How to Test

### Test 1: Manual Token Check (in React DevTools)

Add this temporary code to a test component:

```javascript
import fcmService from '../lib/notifications/fcmService';

export default function TokenTest() {
  return (
    <Button
      title="Get Token"
      onPress={async () => {
        const token = await fcmService.getDeviceToken();
        console.log('Token:', token);
        
        // Check format
        if (token.includes('ExponentPushToken')) {
          console.warn('❌ Got Expo token, should be Firebase');
        } else if (token.includes(':')) {
          console.log('✅ Token looks like Firebase token (has colon)');
        }
      }}
    />
  );
}
```

### Test 2: Check Network in DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by XHR/Fetch
4. Perform login
5. Click on verify-otp or login request
6. Check Request payload → fcm_token field
7. Verify token format:
   - ✅ Should have a colon (:)
   - ❌ Should NOT be `ExponentPushToken[...]`

### Test 3: Check Console Logs

1. Run app on iOS device
2. Open Xcode Console or Safari Web Inspector
3. Filter logs for "token"
4. Look for:
   - ✅ `✅ IOS Firebase token registered`
   - ✅ `tokenType: 'APNs'`
   - ✅ `tokenPreview: 'eoHN...` (has colon)
5. NOT see:
   - ❌ `ExponentPushToken`
   - ❌ `source: 'expo'`

## Token Format Comparison

| Property | Firebase Token | Expo Token |
|----------|---|---|
| Format | `prefix:APxxx...` | `ExponentPushToken[...]` |
| Has Colon | ✅ Yes | ❌ No |
| Has Brackets | ❌ No | ✅ Yes |
| Works with Firebase | ✅ Yes | ❌ No |
| Length | 150-180 chars | 50-80 chars |
| Starts with | Type prefix | `ExponentPushToken` |
| Environment | Firebase APNs | Expo Service |
| Deliverability | ✅ Messages delivered | ❌ Won't work |

## Quick Diagnostic Script

Add to a test screen for debugging:

```javascript
import { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import fcmService from '../lib/notifications/fcmService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function TokenDiagnostic() {
  const [status, setStatus] = useState('');

  const checkToken = async () => {
    try {
      setStatus('Checking...');
      
      // Get current token
      const token = await fcmService.getDeviceToken();
      
      if (!token) {
        setStatus('❌ No token obtained. Firebase not initialized?');
        return;
      }

      const analysis = {
        token: token.substring(0, 50) + '...',
        length: token.length,
        hasColon: token.includes(':'),
        isExpo: token.includes('ExponentPushToken'),
        isCached: token === await AsyncStorage.getItem('fcm_token'),
      };

      if (analysis.isExpo) {
        setStatus('❌ WRONG: Got Expo token instead of Firebase');
      } else if (analysis.hasColon) {
        setStatus('✅ CORRECT: Firebase token with colon');
      } else {
        setStatus('⚠️ Token format unclear');
      }

      console.log('Token Analysis:', analysis);
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
    }
  };

  return (
    <ScrollView>
      <View style={{ padding: 20 }}>
        <Button title="Check Token Format" onPress={checkToken} />
        <Text style={{ marginTop: 20 }}>{status}</Text>
      </View>
    </ScrollView>
  );
}
```

## Expected Behavior Timeline

### Scenario: Fresh App Install

1. **App launches**
   ```
   📱 IOS: Waiting for Firebase to initialize...
   📱 IOS - Attempt 1/5 to get device token...
   ✅ IOS: Successfully got Firebase APNs token
   ✅ IOS Firebase token registered: { tokenType: 'APNs', ... }
   ```

2. **User logs in**
   ```
   📱 OTP Verification Request Details: {
     platform: 'ios',
     tokenType: 'apns',
     hasToken: true,
     tokenPreview: 'eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH...'
   }
   ✅ IOS Push Token successfully sent to server
   ```

3. **Backend stores token**
   ```
   User.push_token = "eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UH..."
   User.push_token_type = "apns"
   ```

4. **Notification sent from Firebase**
   - Backend calls Firebase Admin SDK with user's token
   - Firebase routes to Apple Push Notification service
   - User receives notification on iOS device

### Scenario: Retry Needed

1. **Initial attempt fails** (no Firebase initialized yet)
   ```
   📱 IOS - Attempt 1/5 to get device token...
   ⚠️ Attempt 1 failed, retrying... (Firebase not ready)
   ```

2. **After delay, second attempt succeeds**
   ```
   📱 IOS - Attempt 2/5 to get device token...
   ✅ IOS: Successfully got Firebase APNs token
   ```

## Troubleshooting Decision Tree

```
App running on iOS...

Q: Can you see token in logs?
├─ YES: Continue
│   Q: Does it contain ':'?
│   ├─ YES: ✅ Correct Firebase token
│   │   Q: Does it contain 'ExponentPushToken'?
│   │   ├─ NO: ✅ Perfect!
│   │   └─ YES: ❌ Wrong, retrying...
│   └─ NO: ❌ Check APNs certificate setup
│
└─ NO (Token is null)
    Q: Can you see retry logs?
    ├─ YES (5 retries happening): Firebase initializing, be patient
    └─ NO: Check notification permissions
```

## Summary

Your implementation should now:

✅ Send Firebase tokens to the server (not Expo tokens)  
✅ Log detailed information about which token is being used  
✅ Reject Expo tokens and retry for Firebase tokens  
✅ Use exponential backoff for iOS Firebase initialization  
✅ Work correctly with your Firebase backend  

**If you see `ExponentPushToken` anywhere during login, something is wrong.**

**If you see Firebase format with colon, you're good to go!**
