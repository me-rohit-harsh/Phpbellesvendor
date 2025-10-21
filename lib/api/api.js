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
  
  // removed console.log by codemod — use logger for persistent logs
  // removed console.log by codemod — use logger for persistent logs
  
  return url;
})();

// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs

// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs
// removed console.log by codemod — use logger for persistent logs

// Create axios instance with enhanced configuration for physical devices
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Platform.OS === 'web' ? 30000 : 180000, // Shorter timeout for web, longer for mobile
  headers: {
    'Accept': 'application/json',
    'User-Agent': Platform.OS === 'android' ? 'PhpBellVendor/1.0 (Android)' : 'PhpBellVendor/1.0 (iOS)',
    // Don't set Content-Type here - let axios handle it based on request data
  },
  // Ensure cookies are not sent by default in React Native
  withCredentials: false,
  // Enhanced validation for mobile devices
  validateStatus: function (status) {
    // Accept status codes from 200-299 and also 422 for validation errors
    return (status >= 200 && status < 300) || status === 422;
  },
  // Add retry configuration for mobile network issues
  retry: 3,
  retryDelay: 1000,
  // Force HTTP/1.1 for better compatibility on mobile devices
  httpAgent: Platform.OS !== 'web' ? { keepAlive: true } : undefined,
  httpsAgent: Platform.OS !== 'web' ? { keepAlive: true, rejectUnauthorized: true } : undefined,
});

// Add interceptor to inject token into headers
// Helper to robustly detect React Native FormData
const isRNFormData = (data) => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.append === 'function' &&
    Array.isArray(data._parts)
  );
};
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    console.info(`[API Interceptor] Token check for ${config.url}:`, token ? 'Token found' : 'No token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.info(`[API Interceptor] Added Authorization header for ${config.url}`);
    } else {
      console.info(`[API Interceptor] No token available for ${config.url}`);
    }

    // Ensure each request does not send credentials (cookies) in RN
    config.withCredentials = false;
    // Prefer JSON responses
    config.responseType = 'json';

    // Handle Content-Type based on request data
    if (isRNFormData(config.data)) {
      // For FormData, we need to be very careful about Content-Type handling
      // Completely remove all Content-Type headers to let the system automatically set the correct Content-Type with boundary
      const contentTypeHeaders = ['Content-Type', 'content-type', 'CONTENT-TYPE', 'Content-type'];
      contentTypeHeaders.forEach(header => {
        if (config.headers && config.headers[header]) {
          delete config.headers[header];
        }
      });

      // Also clear any axios default Content-Type to prevent accidental merges
      try {
        if (axios.defaults && axios.defaults.headers) {
          ['post', 'put', 'patch', 'common'].forEach(scope => {
            if (axios.defaults.headers[scope] && axios.defaults.headers[scope]['Content-Type']) {
              delete axios.defaults.headers[scope]['Content-Type'];
            }
          });
        }
      } catch (_) {}

      // Do NOT set Content-Type manually here; let RN/OkHttp add 'multipart/form-data' with boundary automatically

      // Prevent axios from transforming FormData body
      config.transformRequest = [(data, headers) => data];
      // removed console.log by codemod — use logger for persistent logs
      // removed console.log by codemod — use logger for persistent logs
    } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      // For other requests, set JSON content type
      config.headers['Content-Type'] = 'application/json';
    }

    // Android-specific configurations for better network handling
    if (Platform.OS === 'android') {
      // Increase timeout for Android
      config.timeout = config.timeout || 30000;

      // Add connection keep-alive for Android
      config.headers['Connection'] = 'keep-alive';

      // Ensure User-Agent is set for Android
      if (!config.headers['User-Agent']) {
        config.headers['User-Agent'] = 'PhpBellVendor/1.0 (Android)';
      }

      // removed console.log by codemod — use logger for persistent logs
    }

    // removed console.log by codemod — use logger for persistent logs

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
      console.info('Token expired, clearing authentication data...');
      try {
        // Clear all authentication related data
        await AsyncStorage.multiRemove([
          'auth_token',
          'authToken', 
          'isVendorLoggedIn',
          'vendorData'
        ]);
        console.info('Authentication data cleared successfully');
        
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
    
    // Check for network errors and implement retry logic
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Network Error detected on platform:', Platform.OS);
      console.error('Current API Base URL:', API_BASE_URL);
      
      // Implement retry logic for mobile devices with platform-specific handling
      if (Platform.OS !== 'web' && error.config && !error.config.__isRetryRequest) {
        const retryCount = error.config.__retryCount || 0;
        const maxRetries = error.config.retry || 3;
        
        if (retryCount < maxRetries) {
          error.config.__retryCount = retryCount + 1;
          error.config.__isRetryRequest = true;
          
          const delay = error.config.retryDelay || 1000;
          const backoffDelay = delay * Math.pow(2, retryCount); // Exponential backoff
          
          console.info(`Retrying request (${retryCount + 1}/${maxRetries}) after ${backoffDelay}ms delay...`);
          
          // Android-specific retry configuration
          if (Platform.OS === 'android') {
            // removed console.log by codemod — use logger for persistent logs
            error.config.timeout = 45000; // Increase timeout for retry
            error.config.headers = {
              ...error.config.headers,
              'Connection': 'keep-alive',
              'User-Agent': 'PhpBellVendor/1.0 (Android)'
            };
          }
          
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(api(error.config));
            }, backoffDelay);
          });
        }
      }
      
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
        console.error('6. Verify the API server SSL certificate is trusted');
        console.error('7. This specific Android network issue has been fixed - please restart the app');
      } else if (Platform.OS === 'ios') {
        console.error('iOS platform solutions:');
        console.error('1. Check internet connection');
        console.error('2. Verify App Transport Security settings');
        console.error('3. Ensure HTTPS certificate is valid');
        console.error('4. Try rebuilding the app with: expo run:ios');
        console.error('5. Check iOS network permissions');
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
// `testConnectivity` helper removed — connectivity checks should be implemented
// where they're needed (e.g., in a dedicated diagnostics script or a debug
// screen). Keeping this module focused on the axios instance and exports.

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