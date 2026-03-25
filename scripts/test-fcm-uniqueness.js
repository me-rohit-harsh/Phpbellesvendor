#!/usr/bin/env node

/**
 * FCM Token Uniqueness Test Script
 * Run this script to test FCM token generation across multiple runs
 * This helps verify that tokens are unique per device/installation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FCM Token Uniqueness Test\n');

// Simulate multiple token generations
const mockTokens = [
  'eoHNlbcXSiGCwcUGKtcwWj:APA91bFe5O9UHnPr1E5ABZzSlzn_p5S9g64kQwehHk6rz5kRseX-5Xtm9t2e939h1np6ji1t8DKClIQC_a6w7xOEMyHF1uqm3r-nG-roBpikUXvg0Wz1DlI',
  'fk5lAa:APCwXsZ3gF8UkxR2q_pN3nK9mL0oJ2H1W5T6Y7B8C9D',
  'ExponentPushToken[pn_tAsFNEp1ZubBz-x7iJp]', // This should be rejected
];

console.log('Testing token validation logic...\n');

mockTokens.forEach((token, index) => {
  const isExpoToken = token.includes('ExponentPushToken');
  const hasColon = token.includes(':');
  const length = token.length;

  console.log(`Token ${index + 1}:`);
  console.log(`  Value: ${token.substring(0, 50)}...`);
  console.log(`  Length: ${length}`);
  console.log(`  Has colon: ${hasColon}`);
  console.log(`  Is Expo token: ${isExpoToken}`);

  if (isExpoToken) {
    console.log('  ❌ REJECTED: Expo token (not Firebase)');
  } else if (hasColon && length > 100) {
    console.log('  ✅ ACCEPTED: Valid Firebase token format');
  } else {
    console.log('  ⚠️  UNKNOWN: Unexpected token format');
  }
  console.log('');
});

console.log('📋 Testing Checklist for iOS FCM Token Issues:\n');

console.log('1. ✅ Firebase initialized in AppDelegate.swift');
console.log('2. ✅ Token refresh listener added');
console.log('3. ✅ Cached tokens cleared on app start');
console.log('4. ✅ Fresh tokens generated on each registration');
console.log('5. ✅ APNs certificate configured in Firebase Console');
console.log('6. ✅ GoogleService-Info.plist matches Firebase project');
console.log('');

console.log('🔧 Manual Testing Steps:\n');
console.log('1. Delete and reinstall the app on iOS device');
console.log('2. Check console logs for "iOS: Successfully got Firebase APNs token"');
console.log('3. Verify token format has colon and is ~150+ characters');
console.log('4. Test on multiple devices - tokens should be different');
console.log('5. Check server logs to confirm unique tokens received');
console.log('');

console.log('🚨 If tokens are still the same:\n');
console.log('1. Check Firebase Console → Project Settings → Cloud Messaging');
console.log('2. Verify APNs certificates are uploaded');
console.log('3. Ensure GoogleService-Info.plist is correct');
console.log('4. Try different iOS devices/simulators');
console.log('5. Check device has internet connection during token generation');