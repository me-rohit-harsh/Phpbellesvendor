import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Use different API base URL for web development to avoid CORS issues
const API_BASE_URL = (() => {
  // Get the base URL from configuration
  let url = Constants.expoConfig?.extra?.API_BASE_URL || "https://phpadmin.phpbells.com/api";
  
  // Clean the URL thoroughly - remove quotes, backticks, extra spaces, and any hidden characters
  url = url.toString()
    .trim()
    .replace(/[`'"]/g, '')           // Remove quotes and backticks
    .replace(/\s+/g, '')             // Remove all whitespace
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[^\x20-\x7E]/g, '');   // Remove non-printable characters except basic ASCII
  
  // Ensure the URL starts with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash if present
  url = url.replace(/\/$/, '');
  
  console.log('Cleaned API URL:', JSON.stringify(url));
  console.log('URL character codes:', url.split('').map(c => c.charCodeAt(0)));
  
  return url;
})();

// Log the API URL being used for debugging
console.log('API Base URL:', API_BASE_URL);
console.log('API Base URL type:', typeof API_BASE_URL);
console.log('API Base URL length:', API_BASE_URL.length);
console.log('API Base URL JSON:', JSON.stringify(API_BASE_URL));
console.log('Platform:', Platform.OS);
console.log('Development mode:', __DEV__);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for file uploads on mobile devices
  headers: {
    'Accept': 'application/json',
    'User-Agent': Platform.OS === 'android' ? 'PhpBellVendor/1.0 (Android)' : 'PhpBellVendor/1.0 (iOS)',
    // Don't set Content-Type here - let axios handle it based on request data
  },
  // Add retry configuration for mobile devices
  validateStatus: function (status) {
    // Accept status codes from 200-299 and also 422 for validation errors
    return (status >= 200 && status < 300) || status === 422;
  },
});

// Add interceptor to inject token into headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    console.log(`[API Interceptor] Token check for ${config.url}:`, token ? 'Token found' : 'No token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API Interceptor] Added Authorization header for ${config.url}`);
    } else {
      console.log(`[API Interceptor] No token available for ${config.url}`);
    }
    
    // Handle Content-Type based on request data
    if (config.data instanceof FormData) {
      // For FormData, aggressively remove all possible Content-Type variations
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      delete config.headers['CONTENT-TYPE'];
      delete config.headers['Content-type'];
      
      // Set Content-Type to undefined to prevent axios from setting it
      config.headers['Content-Type'] = undefined;
      
      console.log('FormData detected - aggressively removing all Content-Type headers');
      console.log('Headers after FormData handling:', Object.keys(config.headers));
      console.log('Content-Type value:', config.headers['Content-Type']);
    } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      // For other requests, set JSON content type
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Debug logging
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? '[PRESENT]' : '[MISSING]'
      },
      isFormData: config.data instanceof FormData
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Check if response is HTML (indicating server error)
    if (typeof response.data === 'string' && response.data.includes('<html>')) {
      console.error('Received HTML response instead of JSON:', response.data.substring(0, 200));
      throw new Error('Server returned HTML instead of JSON. This might indicate a server error or incorrect endpoint.');
    }
    return response;
  },
  async (error) => {
    // Handle 401 errors by clearing all authentication data
    if (error.response?.status === 401) {
      console.log('Token expired, clearing authentication data...');
      try {
        // Clear all authentication related data
        await AsyncStorage.multiRemove([
          'auth_token',
          'authToken', 
          'isVendorLoggedIn',
          'vendorData'
        ]);
        console.log('Authentication data cleared successfully');
        
        // Note: We don't redirect here as it would cause issues with navigation
        // The app components will handle the redirect when they detect missing auth data
      } catch (clearError) {
        console.error('Error clearing authentication data:', clearError);
      }
    }
    
    // Log detailed error information for debugging
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
      headers: error.config?.headers,
      platform: Platform.OS,
      isNetworkError: !error.response,
      timestamp: new Date().toISOString()
    });
    
    // Check for network errors on different platforms
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network Error detected on platform:', Platform.OS);
      console.error('Current API Base URL:', API_BASE_URL);
      
      if (Platform.OS === 'web') {
        console.error('Web platform solutions:');
        console.error('1. Use Expo Go app on mobile device');
        console.error('2. Use Android/iOS simulator');
        console.error('3. Configure CORS on the server');
        console.error('4. Check if the API server is accessible');
      } else if (Platform.OS === 'android') {
        console.error('Android platform solutions:');
        console.error('1. Check internet connection');
        console.error('2. Verify network security configuration');
        console.error('3. Ensure HTTPS certificate is valid');
        console.error('4. Check if device can access external APIs');
        console.error('5. Try rebuilding the app with: expo run:android');
      } else if (Platform.OS === 'ios') {
        console.error('iOS platform solutions:');
        console.error('1. Check internet connection');
        console.error('2. Verify App Transport Security settings');
        console.error('3. Ensure HTTPS certificate is valid');
        console.error('4. Try rebuilding the app with: expo run:ios');
      }
    }
    
    // Check for malformed URL errors
    if (error.message && error.message.includes('Invalid URL')) {
      console.error('Invalid URL detected:', API_BASE_URL);
      console.error('URL length:', API_BASE_URL.length);
      console.error('URL characters:', Array.from(API_BASE_URL).map(c => c.charCodeAt(0)));
    }
    
    // Check for timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Consider increasing timeout or checking network connection.');
    }
    
    // Check for connection refused errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('Cannot connect to server. Check if the API server is running and accessible.');
      console.error('API Base URL:', API_BASE_URL);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Test network connectivity to the API server
 * @returns {Promise<Object>} Connectivity test results
 */
export const testConnectivity = async () => {
  try {
    console.log('🔍 Testing API connectivity...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 Full test URL:', `${API_BASE_URL}/test`);
    
    // First try a simple GET request to test basic connectivity
    const response = await api.get('/test', { timeout: 15000 });
    console.log('✅ API connectivity test successful');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', response.headers);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.error('❌ API connectivity test failed:', error.message);
    console.error('❌ Error details:', {
      code: error.code,
      status: error.response?.status,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      }
    });
    
    // Try alternative connectivity tests
    console.log('🔄 Attempting alternative connectivity test...');
    try {
      // Test if we can reach the base domain
      const baseTest = await fetch(`${API_BASE_URL.replace('/api', '')}/`, {
        method: 'GET',
        timeout: 10000
      });
      console.log('🌐 Base domain reachable:', baseTest.status);
    } catch (baseError) {
      console.error('❌ Base domain unreachable:', baseError.message);
    }
    
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      status: error.response?.status,
      platform: Platform.OS
    };
  }
};

/**
 * Get detailed API configuration for debugging
 * @returns {Object} API configuration details
 */
export const getAPIConfig = () => {
  return {
    baseURL: API_BASE_URL,
    timeout: 60000,
    platform: Platform.OS,
    isDevelopment: __DEV__,
    urlLength: API_BASE_URL.length,
    urlValid: API_BASE_URL.startsWith('http'),
  };
};

export { api };
export default api;