#!/usr/bin/env node

/**
 * Specific test script for Android food items network issue
 * This script helps diagnose the specific network error with food items on Android
 */

const axios = require('axios');

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
    const response = await axios.get(`${API_BASE_URL}/vendor/menu-items`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'PhpBellVendor/1.0 (Android)',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      }
    });
    const responseTime = Date.now() - startTime;
    
    log(`✅ Food Items API Connection: SUCCESS`, colors.green);
    log(`📡 Response Time: ${responseTime}ms`, colors.green);
    log(`🌐 Status: ${response.status}`, colors.green);
    log(`📦 Items Count: ${Array.isArray(response.data) ? response.data.length : 'Unknown'}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ Food Items API Connection: FAILED`, colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    if (error.code) log(`❌ Code: ${error.code}`, colors.red);
    if (error.response) {
      log(`❌ Response Status: ${error.response.status}`, colors.red);
      log(`❌ Response Data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    return false;
  }
}

async function testWithDifferentConfigurations() {
  log('\n🔍 Testing with Different Configurations...', colors.cyan);
  
  const configs = [
    {
      name: 'Default Configuration',
      config: {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      }
    },
    {
      name: 'Android-Specific Configuration',
      config: {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhpBellVendor/1.0 (Android)',
          'Connection': 'keep-alive'
        }
      }
    },
    {
      name: 'Extended Timeout Configuration',
      config: {
        timeout: 45000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhpBellVendor/1.0 (Android)'
        }
      }
    }
  ];
  
  for (const { name, config } of configs) {
    log(`\n🔄 Testing with ${name}...`, colors.yellow);
    try {
      const response = await axios.get(`${API_BASE_URL}/vendor/menu-items`, config);
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