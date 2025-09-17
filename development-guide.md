# Development Guide - Network Error Fix

## Problem
You're encountering a "Network Error" when trying to make API requests. This is due to CORS (Cross-Origin Resource Sharing) restrictions when running the app in a web browser.

## What is CORS?
CORS is a security feature implemented by web browsers that prevents web pages from making requests to a different domain, protocol, or port than the one serving the web page.

## Solutions

### Option 1: Use Mobile Device or Emulator (Recommended)
The easiest solution is to test the app on a mobile device or emulator where CORS restrictions don't apply:

1. **For iOS Simulator:**
   ```bash
   npm run ios
   ```

2. **For Android Emulator:**
   ```bash
   npm run android
   ```

3. **For Physical Device:**
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal

### Option 2: Use a CORS Proxy (For Web Testing)
If you need to test on web, you can use a CORS proxy service:

1. Update the API base URL in `lib/api/api.js`:
   ```javascript
   // For development only - use CORS proxy
   const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
   const API_BASE_URL = __DEV__ && Platform.OS === 'web' 
     ? CORS_PROXY + 'https://phpadmin.phpbells.com/api'
     : 'https://phpadmin.phpbells.com/api';
   ```

### Option 3: Backend CORS Configuration
Ask your backend developer to add CORS headers to the API server:

```php
// In your PHP backend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## Current Status
- ✅ API server is accessible and working
- ✅ Enhanced error handling for CORS issues
- ✅ Better user-friendly error messages
- ⚠️ CORS restrictions prevent web browser access

## Recommendation
For the best development experience, use the iOS simulator or Android emulator instead of the web browser.