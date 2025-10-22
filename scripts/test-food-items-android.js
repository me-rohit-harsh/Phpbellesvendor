#!/usr/bin/env node

/**
 * Specific test script for Android food items network issue
 * This script helps diagnose the specific network error with food items on Android
 * Updated to use native fetch API instead of axios
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const API_BASE_URL = 'https://phpadmin.phpbells.com/api';

async function testFoodItemsEndpoint() {
  log('\n🔍 Testing Food Items API Endpoint...', colors.cyan);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/vendor/menu-items`, {
      method: 'GET',
      headers: {
        'User-Agent': 'PhpBellVendor/1.0 (Android)',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(30000)
    });
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    log(`✅ Food Items API Connection: SUCCESS`, colors.green);
    log(`📡 Response Time: ${responseTime}ms`, colors.green);
    log(`🌐 Status: ${response.status}`, colors.green);
    log(`📦 Items Count: ${Array.isArray(data) ? data.length : 'Unknown'}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Food Items API Connection: FAILED`, colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testWithDifferentConfigurations() {
  log('\n🔍 Testing with Different Configurations...', colors.cyan);
  
  const configs = [
    {
      name: 'Default Configuration',
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    },
    {
      name: 'Android-Specific Configuration',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhpBellVendor/1.0 (Android)',
        'Connection': 'keep-alive'
      }
    },
    {
      name: 'Extended Timeout Configuration',
      timeout: 45000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhpBellVendor/1.0 (Android)'
      }
    }
  ];
  
  for (const { name, timeout, headers } of configs) {
    log(`\n🔄 Testing with ${name}...`, colors.yellow);
    try {
      const response = await fetch(`${API_BASE_URL}/vendor/menu-items`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(timeout)
      });
      log(`✅ ${name}: SUCCESS`, colors.green);
      log(`📡 Status: ${response.status}`, colors.green);
    } catch (error) {
      log(`❌ ${name}: FAILED`, colors.red);
      log(`❌ Error: ${error.message}`, colors.red);
    }
  }
}

async function runDiagnostics() {
  log('🚀 Starting Food Items Android Network Diagnostics...', colors.bright);
  log(`🌐 Target API: ${API_BASE_URL}/vendor/menu-items`, colors.blue);
  
  const results = {
    basic: await testFoodItemsEndpoint(),
  };
  
  await testWithDifferentConfigurations();
  
  log('\n📊 Diagnostic Results Summary:', colors.bright);
  log(`Food Items Endpoint: ${results.basic ? '✅ PASS' : '❌ FAIL'}`, results.basic ? colors.green : colors.red);
  
  const overallSuccess = Object.values(results).every(result => result);
  
  log(`\n🎯 Overall Status: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
      overallSuccess ? colors.green : colors.red);
  
  if (!overallSuccess) {
    log('\n🔧 Troubleshooting Recommendations:', colors.yellow);
    log('• Check Android network security configuration', colors.yellow);
    log('• Verify HTTPS certificate for phpadmin.phpbells.com', colors.yellow);
    log('• Try rebuilding the React Native app', colors.yellow);
    log('• Check if device can access external APIs', colors.yellow);
    log('• Increase timeout values for Android requests', colors.yellow);
  }
  
  return overallSuccess;
}

// Run diagnostics if script is executed directly
if (require.main === module) {
  runDiagnostics()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Diagnostic script failed: ${error.message}`, colors.red);
      process.exit(1);
    });
}

module.exports = { runDiagnostics };