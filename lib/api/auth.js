import api from './api';
import { handleAPIError } from './errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fcmService from '../notifications/fcmService';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Authentication API functions using fetch
 */

/**
 * Request OTP for phone and email verification
 * @param {Object} data - OTP request data
 * @param {string} data.phone - Phone number with country code
 * @param {string} data.email - Email address
 * @returns {Promise<Object>} OTP request response
 */
export const requestOTP = async (data) => {
  try {
    const deviceToken = await fcmService.getFCMToken();
    const appIdentifier = fcmService.getAppIdentifier();

    const payload = {
      ...data,
      fcm_token: deviceToken || 'Not provided',
      app_identifier: appIdentifier || 'Not provided',
    };

    console.info('Requesting OTP');
    console.info('• Phone:', data.phone);
    console.info('• Email:', data.email);
    console.info('• FCM Token:', deviceToken || 'Not provided');
    console.info('• App Identifier:', appIdentifier || 'Not provided');

    const response = await api.post('/request-otp', payload);
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Verify OTP and get authentication token
 * @param {Object} data - OTP verification data
 * @param {string} data.phone - Phone number with country code
 * @param {string} data.email - Email address
 * @param {string} data.otp - OTP code
 * @returns {Promise<Object>} Verification response with token
 */
export const verifyOTP = async (data) => {
  try {
    const deviceToken = await fcmService.getFCMToken();
    const appIdentifier = fcmService.getAppIdentifier();
    const tokenType = 'fcm';

    const payload = {
      ...data,
      fcm_token: deviceToken || 'Not provided',
      app_identifier: appIdentifier || 'Not provided',
      push_token_type: tokenType,
    };

    // Log detailed token information for debugging
    console.info('📱 OTP Verification Request Details:', {
      platform: Platform.OS,
      tokenType: tokenType,
      hasToken: !!deviceToken,
      tokenPreview: deviceToken ? `${deviceToken.substring(0, 30)}...` : 'null',
      appIdentifier: appIdentifier,
    });

    const response = await api.post('/verify-otp', payload);
    
    console.info('OTP verification API response:', {
      status: response.status,
      data: response.data
    });
    
    // Validate response structure
    if (!response.data) {
      throw new Error('Invalid response from server');
    }
    
    // Log successful token registration
    if (deviceToken) {
      console.info(`✅ ${Platform.OS.toUpperCase()} Push Token successfully sent to server`, {
        tokenType: tokenType,
        platform: Platform.OS
      });
    } else {
      console.warn(`⚠️ No ${Platform.OS.toUpperCase()} push token available during OTP verification`);
    }
    
    return response.data;
  } catch (error) {
    console.error('OTP verification API error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw handleAPIError(error);
  }
};

/**
 * Login user with credentials
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Login response with token
 */
export const login = async (credentials) => {
  try {
    const deviceToken = await fcmService.getFCMToken();
    const appIdentifier = fcmService.getAppIdentifier();
    const tokenType = 'fcm';

    const payload = {
      ...credentials,
      fcm_token: deviceToken || 'Not provided',
      app_identifier: appIdentifier || 'Not provided',
      push_token_type: tokenType,
    };

    // Log detailed token information for debugging iOS
    console.info('📱 Login Request Details:', {
      platform: Platform.OS,
      tokenType: tokenType,
      hasToken: !!deviceToken,
      tokenPreview: deviceToken ? `${deviceToken.substring(0, 30)}...` : 'null',
      appIdentifier: appIdentifier,
    });

    const response = await api.post('/login', payload);
    
    // Log successful token registration
    if (deviceToken) {
      console.info(`✅ ${Platform.OS.toUpperCase()} Push Token successfully sent to server`, {
        tokenType: tokenType,
        platform: Platform.OS
      });
    } else {
      console.warn(`⚠️ No ${Platform.OS.toUpperCase()} push token available during login`);
    }
    
    return response.data;
  } catch (error) {
    throw handleAPIError(error);
  }
};

/**
 * Logout user and clear all authentication data
 * @returns {Promise<Object>} Logout result
 */
export const logout = async () => {
  try {
    console.info('🚪 Starting logout process...');
    
    // Get the current token before clearing storage
    const currentToken = await AsyncStorage.getItem('auth_token');
    
    // Optionally call server logout endpoint first (with token)
    if (currentToken) {
      try {
        console.info('📡 Calling server logout endpoint with token...');
        await api.post('/logout', {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
          timeout: 10000, // 10 seconds timeout for logout
        });
        console.info('✅ Server logout successful');
      } catch (serverError) {
        // Server logout is optional, log but don't fail
        // Token might be expired, which is fine for logout
        console.warn('⚠️ Server logout failed (non-critical):', serverError.message);
        console.info('ℹ️ Proceeding with local logout...');
      }
    } else {
      console.info('ℹ️ No token found, skipping server logout');
    }
    
    // Clear all authentication related data from AsyncStorage
    const keysToRemove = [
      'auth_token',
      'authToken',
      'isVendorLoggedIn',
      'vendorData',
      'user',
      'userProfile'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.info('✅ Authentication data cleared from storage');
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('❌ Error during logout:', error);
    // Even if there's an error, try to clear storage
    try {
      await AsyncStorage.clear();
      console.info('✅ Storage cleared as fallback');
    } catch (clearError) {
      console.error('❌ Failed to clear storage:', clearError);
    }
    // Don't throw error - logout should always succeed locally
    return {
      success: true,
      message: 'Logged out locally (server logout failed)'
    };
  }
};

/**
 * Update device token on server (for already logged-in users)
 * This ensures the push notification token is updated on the server
 * @param {Object} options - Update options
 * @param {string} options.fcm_token - New FCM/APNs token
 * @param {string} options.push_token_type - Token type ('fcm' or 'apns')
 * @param {string} options.app_identifier - App identifier
 * @returns {Promise<Object>} Update response
 */
export const updateDeviceToken = async (options = {}) => {
  try {
    const deviceToken = options.fcm_token || await fcmService.getFCMToken();
    const tokenType = options.push_token_type || 'fcm';
    const appIdentifier = options.app_identifier || fcmService.getAppIdentifier();

    const payload = {
      fcm_token: deviceToken || 'Not provided',
      push_token_type: tokenType,
      app_identifier: appIdentifier,
    };

    console.info('📤 Updating device token on server:', {
      platform: Platform.OS,
      tokenType,
      appIdentifier,
      token: deviceToken ? `${deviceToken.substring(0, 20)}...` : 'not provided'
    });

    const response = await api.post('/update-device-token', payload);
    
    console.info('✅ Device token updated successfully on server');
    return response.data;
  } catch (error) {
    console.error('⚠️ Failed to update device token on server:', error.message);
    // Don't throw - this is not critical
    return {
      success: false,
      message: 'Failed to update device token on server'
    };
  }
};
