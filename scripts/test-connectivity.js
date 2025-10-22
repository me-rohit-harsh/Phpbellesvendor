#!/usr/bin/env node

/**
 * Network Connectivity Test Script for Physical Devices
 * This script helps diagnose network issues when adding food items fails
 * Updated to use native fetch API instead of axios
 */

const https = require('https');
const http = require('http');

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

async function testBasicConnectivity() {
  log('\n🔍 Testing Basic API Connectivity...', colors.cyan);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'PHPBells-Vendor-App/1.0 (Node.js Test)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    });
    const responseTime = Date.now() - startTime;
    
    log(`✅ API Connection: SUCCESS`, colors.green);
    log(`📡 Response Time: ${responseTime}ms`, colors.green);
    log(`🌐 Status: ${response.status}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ API Connection: FAILED`, colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testDNSResolution() {
  log('\n🔍 Testing DNS Resolution...', colors.cyan);
  
  try {
    const dns = require('dns').promises;
    const hostname = 'phpadmin.phpbells.com';
    const addresses = await dns.lookup(hostname);
    
    log(`✅ DNS Resolution: SUCCESS`, colors.green);
    log(`🌐 Hostname: ${hostname}`, colors.green);
    log(`📍 IP Address: ${addresses.address}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ DNS Resolution: FAILED`, colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testHTTPSCertificate() {
  log('\n🔍 Testing HTTPS Certificate...', colors.cyan);
  
  try {
    const https = require('https');
    const url = require('url');
    
    return new Promise((resolve) => {
      const options = url.parse('https://phpadmin.phpbells.com');
      options.method = 'HEAD';
      options.timeout = 10000;
      
      const req = https.request(options, (res) => {
        log(`✅ HTTPS Certificate: VALID`, colors.green);
        log(`🔒 TLS Version: ${res.socket.getProtocol()}`, colors.green);
        resolve(true);
      });
      
      req.on('error', (error) => {
        log(`❌ HTTPS Certificate: INVALID`, colors.red);
        log(`❌ Error: ${error.message}`, colors.red);
        resolve(false);
      });
      
      req.on('timeout', () => {
        log(`❌ HTTPS Certificate: TIMEOUT`, colors.red);
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    log(`❌ HTTPS Certificate: ERROR`, colors.red);
    log(`❌ Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testAPIEndpoint() {
  log('\n🔍 Testing API Endpoint...', colors.cyan);
  
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/menu-categories`, {
      method: 'GET',
      headers: {
        'User-Agent': 'PHPBells-Vendor-App/1.0 (Node.js Test)',
        'Accept': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    log(`✅ API Endpoint: ACCESSIBLE`, colors.green);
    log(`📡 Status: ${response.status}`, colors.green);
    log(`📄 Content-Type: ${response.headers.get('content-type')}`, colors.green);
    return true;
  } catch (error) {
    if (error.response) {
      log(`⚠️ API Endpoint: ACCESSIBLE (Auth Required)`, colors.yellow);
      log(`📡 Status: ${error.response.status}`, colors.yellow);
      return true; // 401/403 means endpoint is accessible but needs auth
    } else {
      log(`❌ API Endpoint: INACCESSIBLE`, colors.red);
      log(`❌ Error: ${error.message}`, colors.red);
      return false;
    }
  }
}

async function runDiagnostics() {
  log('🚀 Starting Network Connectivity Diagnostics...', colors.bright);
  log(`🌐 Target API: ${API_BASE_URL}`, colors.blue);
  log(`📱 Platform: Node.js (${process.platform})`, colors.blue);
  
  const results = {
    dns: await testDNSResolution(),
    https: await testHTTPSCertificate(),
    basic: await testBasicConnectivity(),
    endpoint: await testAPIEndpoint()
  };
  
  log('\n📊 Diagnostic Results Summary:', colors.bright);
  log(`DNS Resolution: ${results.dns ? '✅ PASS' : '❌ FAIL'}`, results.dns ? colors.green : colors.red);
  log(`HTTPS Certificate: ${results.https ? '✅ PASS' : '❌ FAIL'}`, results.https ? colors.green : colors.red);
  log(`Basic Connectivity: ${results.basic ? '✅ PASS' : '❌ FAIL'}`, results.basic ? colors.green : colors.red);
  log(`API Endpoint: ${results.endpoint ? '✅ PASS' : '❌ FAIL'}`, results.endpoint ? colors.green : colors.red);
  
  const overallSuccess = Object.values(results).every(result => result);
  
  log(`\n🎯 Overall Status: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
      overallSuccess ? colors.green : colors.red);
  
  if (!overallSuccess) {
    log('\n🔧 Troubleshooting Recommendations:', colors.yellow);
    if (!results.dns) log('• Check internet connection and DNS settings', colors.yellow);
    if (!results.https) log('• Verify HTTPS certificate and TLS configuration', colors.yellow);
    if (!results.basic) log('• Check firewall and network security settings', colors.yellow);
    if (!results.endpoint) log('• Verify API server status and endpoint availability', colors.yellow);
    log('• Try rebuilding the React Native app', colors.yellow);
    log('• Check Android network security configuration', colors.yellow);
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