/**
 * Android Network Fix for Food Items
 * This module provides specific fixes for Android network issues with food items API
 */

import { Platform } from 'react-native';
import api from './api';
import { handleAPIError } from './errorHandler';
import { logRequestDetails, logResponseDetails } from './vendorUtils';

/**
 * Get vendor's menu items with Android-specific network handling
 * This function implements specific fixes for Android network errors
 * @returns {Promise} API response with menu items data
 */
export const getAndroidMenuItems = async () => {
  // Only apply Android-specific fixes on Android platform
  if (Platform.OS !== 'android') {
    // For non-Android platforms, use standard function
    const { getMenuItems } = await import('./vendorMenuItems');
    return getMenuItems();
  }
  
  try {
    console.info('🤖 Android-specific food items request starting...');
    logRequestDetails('Fetching vendor menu items (Android Fix)', '/vendor/menu-items');
    
    // Android-specific configuration with multiple fallback strategies
    const configs = [
      // Primary configuration
      {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhpBellVendor/1.0 (Android)',
          'Connection': 'keep-alive'
        }
      },
      // Fallback configuration with extended timeout
      {
        timeout: 45000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhpBellVendor/1.0 (Android)',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache'
        }
      },
      // Last resort configuration
      {
        timeout: 60000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PhpBellVendor/1.0 (Android)'
        }
      }
    ];
    
    // Try each configuration in sequence
    for (let i = 0; i < configs.length; i++) {
      try {
        console.info(`🤖 Trying Android configuration ${i + 1}/${configs.length}...`);
        const response = await api.get('/vendor/menu-items', configs[i]);
        logResponseDetails('Menu items fetch (Android Fix)', response);
        console.info(`✅ Android configuration ${i + 1} succeeded`);
        return response.data;
      } catch (error) {
        console.info(`❌ Android configuration ${i + 1} failed:`, error.message);
        
        // If this is the last configuration, throw the error
        if (i === configs.length - 1) {
          throw error;
        }
        
        // Wait a bit before trying the next configuration
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('❌ Android food items request failed after all retries:', error);
    throw handleAPIError(error);
  }
};

/**
 * Get menu items by category with Android-specific network handling
 * @param {string|number} categoryId - The category ID
 * @returns {Promise} API response with menu items data for the category
 */
export const getAndroidMenuItemsByCategory = async (categoryId) => {
  // Only apply Android-specific fixes on Android platform
  if (Platform.OS !== 'android') {
    // For non-Android platforms, use standard function
    const { getMenuItemsByCategory } = await import('./vendorMenuItems');
    return getMenuItemsByCategory(categoryId);
  }
  
  try {
    console.info('🤖 Android-specific food items by category request starting...');
    logRequestDetails('Fetching menu items by category (Android Fix)', `/vendor/menu-categories/${categoryId}/items`);
    
    // Android-specific configuration
    const config = {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhpBellVendor/1.0 (Android)',
        'Connection': 'keep-alive'
      }
    };
    
    const response = await api.get(`/vendor/menu-categories/${categoryId}/items`, config);
    logResponseDetails('Menu items by category fetch (Android Fix)', response);
    return response.data;
  } catch (error) {
    console.error('❌ Android food items by category request failed:', error);
    throw handleAPIError(error);
  }
};

export default {
  getAndroidMenuItems,
  getAndroidMenuItemsByCategory
};