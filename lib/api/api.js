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

// Fetch API configuration
const DEFAULT_TIMEOUT = Platform.OS === 'web' ? 30000 : 1800000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Helper to create timeout for fetch requests
 */
const createTimeout = (ms) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

/**
 * Helper to check if data is React Native FormData
 */
const isRNFormData = (data) => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.append === 'function' &&
    Array.isArray(data._parts)
  );
};

/**
 * Fetch wrapper with authentication, retries, and error handling
 */
class FetchAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('auth_token');
    const headers = {
      'Accept': 'application/json',
      'User-Agent': Platform.OS === 'android' ? 'PhpBellVendor/1.0 (Android)' : 'PhpBellVendor/1.0 (iOS)',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.info('[API] Token found and added to headers');
    } else {
      console.info('[API] No token available');
    }

    // Android-specific headers
    if (Platform.OS === 'android') {
      headers['Connection'] = 'keep-alive';
    }

    return headers;
  }

  async request(url, options = {}) {
    const { 
      method = 'GET', 
      body = null, 
      headers = {}, 
      timeout = DEFAULT_TIMEOUT,
      retries = MAX_RETRIES,
      retryDelay = RETRY_DELAY,
      ...otherOptions 
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const authHeaders = await this.getAuthHeaders();
    
    let finalHeaders = { ...authHeaders, ...headers };
    let finalBody = body;

    // Handle FormData - don't set Content-Type, let browser/native handle it
    if (isRNFormData(body)) {
      console.info('📦 FormData detected - removing Content-Type header');
      delete finalHeaders['Content-Type'];
    } else if (body && typeof body === 'object' && !isRNFormData(body)) {
      // JSON body
      finalHeaders['Content-Type'] = 'application/json';
      finalBody = JSON.stringify(body);
    }

    const fetchOptions = {
      method,
      headers: finalHeaders,
      body: finalBody,
      ...otherOptions,
    };

    console.info(`[Fetch] ${method} ${fullUrl}`);

    // Retry logic
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await Promise.race([
          fetch(fullUrl, fetchOptions),
          createTimeout(timeout),
        ]);

        // Check for HTML response instead of JSON
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const text = await response.text();
          if (text.includes('<html>')) {
            console.error('Received HTML response instead of JSON');
            throw new Error('Server returned HTML instead of JSON');
          }
        }

        // Handle non-OK responses
        if (!response.ok && response.status !== 422) {
          const errorData = await this.parseResponse(response);
          const error = new Error(errorData?.message || errorData?.error || `HTTP ${response.status}`);
          error.response = { status: response.status, data: errorData };
          throw error;
        }

        // Handle 401 - clear auth data
        if (response.status === 401) {
          console.info('Token expired, clearing authentication data...');
          await AsyncStorage.multiRemove(['auth_token', 'authToken', 'isVendorLoggedIn', 'vendorData']);
        }

        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw error;
        }

        // Retry logic
        if (attempt < retries) {
          const backoffDelay = retryDelay * Math.pow(2, attempt);
          console.info(`Retry attempt ${attempt + 1}/${retries} after ${backoffDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // All retries failed
    console.error('All retry attempts failed:', lastError);
    throw lastError;
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async get(url, options = {}) {
    const response = await this.request(url, { ...options, method: 'GET' });
    return { data: await this.parseResponse(response), status: response.status, headers: response.headers };
  }

  async post(url, body, options = {}) {
    const response = await this.request(url, { ...options, method: 'POST', body });
    return { data: await this.parseResponse(response), status: response.status, headers: response.headers };
  }

  async put(url, body, options = {}) {
    const response = await this.request(url, { ...options, method: 'PUT', body });
    return { data: await this.parseResponse(response), status: response.status, headers: response.headers };
  }

  async delete(url, options = {}) {
    const response = await this.request(url, { ...options, method: 'DELETE' });
    return { data: await this.parseResponse(response), status: response.status, headers: response.headers };
  }
}

const api = new FetchAPI(API_BASE_URL);



/**
 * Test network connectivity to the API server
 * @returns {Promise<Object>} Connectivity test results
 */
export const testConnectivity = async () => {
  try {
    const response = await api.get('/test', { timeout: 10000 });
    return {
      success: true,
      message: 'Connection successful',
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error,
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