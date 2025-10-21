/**
 * Vendor Registration and Profile Management
 * Functions for vendor registration, profile operations, and complete profile management
 */

import { Platform } from 'react-native';
import api, { getAPIConfig } from './api';
import { handleAPIError } from './errorHandler';
import { retryRequest, createFormDataForUpload, logRequestDetails, logResponseDetails } from './vendorUtils';
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
    // removed console.log by codemod — use logger for persistent logs

    // removed console.log by codemod — use logger for persistent logs

    // Test connectivity before making the request
    console.info('Testing API connectivity...');
      // Lightweight connectivity check: try a simple GET to /test endpoint
      try {
        const cfg = getAPIConfig();
        await api.get('/test', { timeout: 10000 });
      } catch (connectErr) {
        console.warn('Connectivity check failed in vendorRegistration:', connectErr.message);
        throw new Error('No connectivity to API server');
      }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // removed console.log by codemod — use logger for persistent logs
    // removed console.log by codemod — use logger for persistent logs
    // removed console.log by codemod — use logger for persistent logs
    formData.append('name', vendorData.name);
    formData.append('restaurant_name', vendorData.restaurant_name);
    formData.append('vendor_type_id', vendorData.vendor_type_id);
    formData.append('description', vendorData.description || '');
    formData.append('gst_no', vendorData.gst_no || '');
    formData.append('fassai_license_no', vendorData.fassai_license_no || '');
    
    // Add food types array
    if (vendorData.food_types && Array.isArray(vendorData.food_types)) {
      vendorData.food_types.forEach((foodType, index) => {
        formData.append(`food_types[${index}]`, foodType.toString());
      });
    }
    
    // Add file uploads with proper React Native FormData structure
    const fileFields = ['id_proof', 'profile_photo', 'logo', 'banner_image', 'gst_certificate', 'shop_license'];
    
    fileFields.forEach(fieldName => {
      const file = vendorData[fieldName];
      if (file && file.uri) {
        let fileObj;
        
        if (Platform.OS === 'android') {
          // Android-specific handling: Use file extension for type
          const fileExtension = file.uri.split('.').pop() || 'jpg';
          fileObj = {
            uri: file.uri,
            type: `image/${fileExtension}`, // Manually construct type for Android
            name: file.name || `${fieldName}.${fileExtension}`,
          };
          // removed console.log by codemod — use logger for persistent logs
        } else {
          // iOS and other platforms: Use original logic
          fileObj = {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `${fieldName}.jpg`,
          };
          // removed console.log by codemod — use logger for persistent logs
        }
        
        formData.append(fieldName, fileObj);
      }
    });
    
    // removed console.log by codemod — use logger for persistent logs
    
    // Create a custom config to ensure proper FormData handling
    const config = {
      timeout: 300000, // 5 minutes for file uploads
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: [
        // Return FormData as-is without any transformation
        (data) => {
          // removed console.log by codemod — use logger for persistent logs
          // removed console.log by codemod — use logger for persistent logs
          return data;
        }
      ]
    };
    
    console.info('🚀 Sending vendor registration request...');
    const response = await api.post('/vendor/register', formData, config);
    
    console.info('✅ Vendor registration successful:', response.data);
    return response.data;
  };

  try {
    return await retryRequest(makeRegistrationRequest, 3, 2000);
  } catch (error) {
    console.error('❌ Vendor registration failed after all retries:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get vendor profile information
 * @returns {Promise} API response with vendor profile data
 */
export const getVendorProfile = async () => {
  try {
    logRequestDetails('Fetching vendor profile', '/profile');
    const response = await api.get('/profile');
    logResponseDetails('Vendor profile fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get complete vendor profile information
 * @returns {Promise} API response with complete profile data
 */
export const getCompleteProfile = async () => {
  try {
    logRequestDetails('Fetching complete vendor profile', '/complete-profile');
    const response = await api.post('/complete-profile');
    logResponseDetails('Complete profile fetch', response);
    return response;
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    throw handleAPIError(error);
  }
};

/**
 * Update complete vendor profile information
 * @param {Object} profileData - The complete profile data to update
 * @returns {Promise} API response confirming the update
 */
export const updateCompleteProfile = async (profileData) => {
  try {
    logRequestDetails('Updating complete vendor profile', '/vendor/complete-profile', profileData);
    const response = await api.put('/vendor/complete-profile', profileData);
    logResponseDetails('Complete profile update', response);
    return response;
  } catch (error) {
    console.error('Error updating complete profile:', error);
    throw handleAPIError(error);
  }
};