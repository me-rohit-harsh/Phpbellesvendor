#!/usr/bin/env node

/**
 * FCM Setup Verification Script
 * Run this script to verify FCM integration is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FCM Integration Setup...\n');

const checks = [
  {
    name: 'google-services.json exists',
    path: './android/app/google-services.json',
    required: true,
  },
  {
    name: 'FCM Service file created',
    path: './lib/notifications/fcmService.js',
    required: true,
  },
  {
    name: 'FCM Hook created',
    path: './hooks/useFCMNotifications.js',
    required: true,
  },
  {
    name: 'Auth.js updated',
    path: './lib/api/auth.js',
    required: true,
    contains: 'fcm_token',
  },
  {
    name: '_layout.jsx updated',
    path: './app/_layout.jsx',
    required: true,
    contains: 'useFCMNotifications',
  },
  {
    name: 'app.json configured',
    path: './app.json',
    required: true,
    contains: 'expo-notifications',
  },
];

let allPassed = true;

checks.forEach((check) => {
  const filePath = path.join(__dirname, check.path);
  const exists = fs.existsSync(filePath);
  
  if (!exists) {
    console.log(`❌ ${check.name}`);
    console.log(`   File not found: ${check.path}\n`);
    if (check.required) allPassed = false;
    return;
  }

  if (check.contains) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasContent = content.includes(check.contains);
    
    if (!hasContent) {
      console.log(`⚠️  ${check.name}`);
      console.log(`   File exists but missing: ${check.contains}\n`);
      if (check.required) allPassed = false;
      return;
    }
  }

  console.log(`✅ ${check.name}`);
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ FCM Integration Setup Complete!\n');
  console.log('Next Steps:');
  console.log('1. Run: npm install (if not already done)');
  console.log('2. Test on physical device (FCM doesn\'t work on emulators)');
  console.log('3. Visit /business/fcm-test route to test notifications');
  console.log('4. Check FCM_INTEGRATION_GUIDE.md for full documentation\n');
} else {
  console.log('❌ Setup Incomplete\n');
  console.log('Please review the errors above and ensure all files are properly created.\n');
  process.exit(1);
}
