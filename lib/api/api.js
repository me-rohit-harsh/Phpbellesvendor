import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Use different API base URL for web development to avoid CORS issues
const API_BASE_URL = (() => {
  // Get the base URL from configuration
  let url = Constants.expoConfig?.extra?.API_BASE_URL || "https://phpadmin.phpbells.com/api";
  
  // Clean the URL thoroughly - remove quotes, backticks, and extra spaces
  url = url.toString().trim().replace(/[`'"]/g, '').replace(/\s+/g, '');
  
  // Ensure the URL starts with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash if present
  url = url.replace(/\/$/, '');
  
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
  timeout: 60000, // 60 seconds timeout for file uploads
  headers: {
    'Accept': 'application/json',
    // Don't set Content-Type here - let axios handle it based on request data
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
      // For FormData, completely remove Content-Type to let axios set it with boundary
      delete config.headers['Content-Type'];
      console.log('FormData detected - removing Content-Type header');
    } else if (!config.headers['Content-Type']) {
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
  (error) => {
    // Handle 401 errors by clearing token
    if (error.response?.status === 401) {
      AsyncStorage.removeItem("auth_token");
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
    
    // Check for CORS errors on web platform
    if (Platform.OS === 'web' && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
      console.error('CORS/Network Error detected on web platform.');
      console.error('Current API Base URL:', API_BASE_URL);
      console.error('Suggested solutions:');
      console.error('1. Use Expo Go app on mobile device');
      console.error('2. Use Android/iOS simulator');
      console.error('3. Configure CORS on the server');
      console.error('4. Check if the API server is accessible');
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
 * @returns {Promise<boolean>} True if server is reachable
 */
export const testConnectivity = async () => {
  try {
    console.log('Testing connectivity to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000,
    });
    
    console.log('Connectivity test response:', response.status);
    return response.status < 500; // Accept any response that's not a server error
  } catch (error) {
    console.error('Connectivity test failed:', error.message);
    return false;
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