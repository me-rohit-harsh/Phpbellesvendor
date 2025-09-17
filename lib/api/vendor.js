import api, { testConnectivity, getAPIConfig } from './api';
import { handleAPIError } from './errorHandler';

/**
 * Retry a request function with exponential backoff
 * @param {Function} requestFn - The request function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} The result of the successful request
 */
const retryRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
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
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Register a new vendor with all required information and file uploads
 * @param {Object} vendorData - The vendor registration data
 * @param {string} vendorData.name - Vendor name
 * @param {string} vendorData.restaurant_name - Restaurant name
 * @param {string} vendorData.vendor_type_id - Vendor type ID
 * @param {Array} vendorData.food_types - Array of food type IDs
 * @param {Object} vendorData.id_proof - ID proof file object
 * @param {Object} vendorData.profile_photo - Profile photo file object
 * @param {Object} vendorData.logo - Logo file object
 * @param {Object} vendorData.banner_image - Banner image file object
 * @param {string} vendorData.description - Restaurant description
 * @param {string} vendorData.gst_no - GST number
 * @param {Object} vendorData.gst_certificate - GST certificate file object
 * @param {string} vendorData.fassai_license_no - FSSAI license number
 * @param {Object} vendorData.shop_license - Shop license file object
 * @returns {Promise} API response
 */


export const registerVendor = async (vendorData) => {
  const makeRegistrationRequest = async () => {
    console.log('Starting vendor registration with data:', {
      name: vendorData.name,
      restaurant_name: vendorData.restaurant_name,
      vendor_type_id: vendorData.vendor_type_id,
      hasFiles: {
        id_proof: !!vendorData.id_proof,
        profile_photo: !!vendorData.profile_photo,
        logo: !!vendorData.logo,
        banner_image: !!vendorData.banner_image,
        gst_certificate: !!vendorData.gst_certificate,
        shop_license: !!vendorData.shop_license,
      }
    });

    // Log API configuration for debugging
    console.log('API Configuration:', getAPIConfig());

    // Test connectivity before making the request
    console.log('Testing API connectivity...');
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.warn('Connectivity test failed, but proceeding with request...');
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    console.log('Creating FormData for vendor registration...');
    console.log('Vendor data keys:', Object.keys(vendorData));
    console.log('FormData constructor:', FormData.name);
    
    // Add text fields
    formData.append('name', vendorData.name);
    formData.append('restaurant_name', vendorData.restaurant_name);
    formData.append('vendor_type_id', vendorData.vendor_type_id);
    formData.append('description', vendorData.description || '');
    formData.append('gst_no', vendorData.gst_no || '');
    formData.append('fassai_license_no', vendorData.fassai_license_no || '');
    
    // Add food types array
    if (vendorData.food_types && Array.isArray(vendorData.food_types)) {
      vendorData.food_types.forEach((foodType, index) => {
        formData.append(`food_types[${index}]`, foodType);
      });
    }
    
    // Add file uploads with proper React Native FormData structure
    const addFileToFormData = (formData, fieldName, fileData) => {
      if (fileData && fileData.uri) {
        // For React Native, we need to create a proper file object
        const fileObj = {
          uri: fileData.uri,
          type: fileData.type || 'image/jpeg',
          name: fileData.name || `${fieldName}.jpg`,
        };
        
        // Log file details for debugging
        console.log(`Adding ${fieldName} to FormData:`, fileObj);
        
        formData.append(fieldName, fileObj);
      }
    };
    
    addFileToFormData(formData, 'id_proof', vendorData.id_proof);
    addFileToFormData(formData, 'profile_photo', vendorData.profile_photo);
    addFileToFormData(formData, 'logo', vendorData.logo);
    addFileToFormData(formData, 'banner_image', vendorData.banner_image);
    addFileToFormData(formData, 'gst_certificate', vendorData.gst_certificate);
    addFileToFormData(formData, 'shop_license', vendorData.shop_license);

    console.log('Making API request to /vendor/register...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/register`);
    console.log('FormData entries count:', Array.from(formData.entries()).length);
    console.log('FormData type check:', formData instanceof FormData);
    console.log('FormData toString:', formData.toString());
    
    // Log all FormData entries for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`FormData entry: ${key} =`, typeof value === 'object' ? JSON.stringify(value) : value);
    }
    
    // Let axios handle Content-Type automatically for FormData
    const response = await api.post('/vendor/register', formData, {
      timeout: 180000, // 3 minutes for file upload
    });
    
    console.log('Vendor registration successful:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeRegistrationRequest, 3, 2000);
  } catch (error) {
    console.error('Vendor registration failed after all retries:', error);
    console.error('Final error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    // Additional network error debugging
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error detected. This could be due to:');
      console.error('1. CORS issues (if running on web)');
      console.error('2. FormData content-type issues');
      console.error('3. Server connectivity problems');
      console.error('4. Request timeout');
      console.error('Request config:', {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      });
    }
    
    throw handleAPIError(error);
  }
};

/**
 * Get vendor profile information
 * @returns {Promise} API response with vendor profile data
 */
export const getVendorProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};



/**
 * Get vendor types from API with retry logic
 * @returns {Promise} API response with vendor types
 */
export const getVendorTypes = async () => {
  const makeVendorTypesRequest = async () => {
    console.log('Fetching vendor types...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/vendor-types`);
    
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for vendor types request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.get('/vendor/vendor-types', {
      timeout: 30000, // 30 seconds timeout
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    console.log('Vendor types response:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeVendorTypesRequest, 3, 1000);
  } catch (error) {
    console.error('Failed to fetch vendor types after all retries:', error);
    console.error('Vendor types error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw handleAPIError(error);
  }
};

/**
 * Get food types from API with retry logic
 * @returns {Promise} API response with food types
 */
export const getFoodTypes = async () => {
  const makeFoodTypesRequest = async () => {
    console.log('Fetching food types...');
    console.log('Request URL:', `${api.defaults.baseURL}/vendor/food-types`);
    
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for food types request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.get('/vendor/food-types', {
      timeout: 30000, // 30 seconds timeout
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    console.log('Food types response:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeFoodTypesRequest, 3, 1000);
  } catch (error) {
    console.error('Failed to fetch food types after all retries:', error);
    console.error('Food types error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    throw handleAPIError(error);
  }
};

/**
 * Toggle vendor online/offline status
 * @returns {Promise} API response with updated status
 */
export const toggleVendorStatus = async () => {
  try {
    const response = await api.post('/vendor/toggle-status');
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Check vendor verification/approval status
 * @returns {Promise} API response with vendor status
 */
export const getVendorStatus = async () => {
  try {
    // Get token from AsyncStorage for explicit logging
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('auth_token');
    console.log('Token available for vendor status request:', token ? 'Yes' : 'No');
    console.log('Token length:', token ? token.length : 0);
    
    const response = await api.post('/vendor/vendor-status', {}, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error getting vendor status:', error);
    throw handleAPIError(error);
  }
};