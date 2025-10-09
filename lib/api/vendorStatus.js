/**
 * Vendor Status and Type Management
 * Functions for managing vendor status, vendor types, and food types
 */

import api from './api';
import { handleAPIError } from './errorHandler';
import { retryRequest, createAuthHeaders, logRequestDetails, logResponseDetails } from './vendorUtils';

/**
 * Get vendor types from API with retry logic
 * @returns {Promise} API response with vendor types
 */
export const getVendorTypes = async () => {
  const makeVendorTypesRequest = async () => {
    logRequestDetails('Fetching vendor types', `${api.defaults.baseURL}/vendor/vendor-types`);
    
    // Get token and create headers
    const headers = await createAuthHeaders();
    console.info('Token available for vendor types request:', Object.keys(headers).length > 0 ? 'Yes' : 'No');
    
    const response = await api.get('/vendor/vendor-types', {
      timeout: 30000, // 30 seconds timeout
      headers
    });
    
    logResponseDetails('Vendor types fetch', response);
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
    logRequestDetails('Fetching food types', `${api.defaults.baseURL}/vendor/food-types`);
    
    // Get token and create headers
    const headers = await createAuthHeaders();
    console.info('Token available for food types request:', Object.keys(headers).length > 0 ? 'Yes' : 'No');
    
    const response = await api.get('/vendor/food-types', {
      timeout: 30000, // 30 seconds timeout
      headers
    });
    
    logResponseDetails('Food types fetch', response);
    return response.data;
  };

  try {
    return await retryRequest(makeFoodTypesRequest, 1, 1000);
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
    logRequestDetails('Toggling vendor status', '/vendor/toggle-status');
    const response = await api.post('/vendor/toggle-status');
    logResponseDetails('Vendor status toggle', response);
    return response.data;
  } catch (error) {
    console.error('Error toggling vendor status:', error);
    throw handleAPIError(error);
  }
};

/**
 * Check vendor verification/approval status
 * @returns {Promise} API response with vendor status
 */
export const getVendorStatus = async () => {
  try {
    logRequestDetails('Fetching vendor status', '/vendor/vendor-status');
    
    // Get token and create headers
    const headers = await createAuthHeaders();
    console.info('Token available for vendor status request:', Object.keys(headers).length > 0 ? 'Yes' : 'No');
    
    const response = await api.post('/vendor/vendor-status', {}, {
      headers
    });
    
    logResponseDetails('Vendor status fetch', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor status:', error);
    throw handleAPIError(error);
  }
};