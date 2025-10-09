/**
 * Vendor API Utilities
 * Shared utility functions for vendor operations
 */
import { Platform } from 'react-native';

/**
 * Retry a request function with exponential backoff
 * @param {Function} requestFn - The request function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} The result of the successful request
 */
export const retryRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // removed console.log by codemod — use logger for persistent logs
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed');
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const delay = baseDelay * Math.pow(2, attempt - 1);
      // removed console.log by codemod — use logger for persistent logs
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Get authentication token from AsyncStorage
 * @returns {Promise<string|null>} The auth token or null if not found
 */
export const getAuthToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Create headers with authentication token
 * @param {string} token - Optional token to use, if not provided will fetch from storage
 * @returns {Promise<Object>} Headers object with authorization
 */
export const createAuthHeaders = async (token = null) => {
  const authToken = token || await getAuthToken();
  return authToken ? {
    'Authorization': `Bearer ${authToken}`
  } : {};
};

/**
 * Log request details for debugging
 * @param {string} operation - The operation being performed
 * @param {string} url - The request URL
 * @param {Object} data - Optional request data
 */
export const logRequestDetails = (operation, url, data = null) => {
  console.info(`🔄 ${operation}...`);
  console.info('Request URL:', url);
  if (data) {
    console.info('Request data:', data);
  }
};

/**
 * Log response details for debugging
 * @param {string} operation - The operation that was performed
 * @param {Object} response - The API response
 */
export const logResponseDetails = (operation, response) => {
  console.info(`✅ ${operation} successful:`, response.data);
  console.info('Response status:', response.status);
};

/**
 * Create FormData for file uploads with proper React Native structure
 * @param {Object} data - The data object containing fields and files
 * @param {Array} fileFields - Array of field names that contain files
 * @returns {FormData} Properly formatted FormData object
 */
export const createFormDataForUpload = (data, fileFields = []) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (fileFields.includes(key) && value) {
      // Handle file objects with platform-specific logic
      if (typeof value === 'object' && value.uri) {
        let fileObj;
        
        if (Platform.OS === 'android') {
          // Android-specific handling: Use file extension for type
          const fileExtension = value.uri.split('.').pop() || 'jpg';
          fileObj = {
            uri: value.uri,
            type: `image/${fileExtension}`, // Manually construct type for Android
            name: value.name || `${key}.${fileExtension}`,
          };
          // removed console.log by codemod — use logger for persistent logs
        } else {
          // iOS and other platforms: Use original logic
          fileObj = {
            uri: value.uri,
            type: value.type || 'image/jpeg',
            name: value.name || `${key}.jpg`,
          };
          // removed console.log by codemod — use logger for persistent logs
        }
        
        formData.append(key, fileObj);
      } else if (typeof value === 'string' && value.trim() !== '') {
        // Handle URL strings
        // removed console.log by codemod — use logger for persistent logs
        formData.append(`${key}_url`, value.trim());
      }
    } else if (value !== undefined && value !== null) {
      // Handle regular fields
      if (Array.isArray(value)) {
        // Handle arrays (like food_types)
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item.toString());
        });
      } else if (typeof value === 'boolean') {
        // Handle boolean values
        formData.append(key, value ? '1' : '0');
      } else {
        // Handle other values
        formData.append(key, value.toString());
      }
    }
  });
  
  return formData;
};

/**
 * Validate image file format and size
 * @param {Object} imageFile - The image file object
 * @param {number} maxSizeMB - Maximum file size in MB (default: 5)
 * @returns {Object} Validation result with isValid and error message
 */
export const validateImageFile = (imageFile, maxSizeMB = 5) => {
  if (!imageFile) {
    return { isValid: false, error: 'No image file provided' };
  }
  
  // Check if it's a valid image (either file object with uri or a URL string)
  const isValidImage = (
    (typeof imageFile === 'object' && imageFile.uri) || 
    (typeof imageFile === 'string' && imageFile.trim() !== '')
  );
  
  if (!isValidImage) {
    return { 
      isValid: false, 
      error: 'Invalid image format. Please provide a valid image file or URL.' 
    };
  }
  
  // Check file size if it's a file object
  if (typeof imageFile === 'object' && imageFile.fileSize) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (imageFile.fileSize > maxSizeBytes) {
      return { 
        isValid: false, 
        error: `File size is too large. Please choose a smaller image (max ${maxSizeMB}MB).` 
      };
    }
  }
  
  return { isValid: true, error: null };
};